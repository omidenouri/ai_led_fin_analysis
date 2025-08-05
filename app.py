from flask import Flask, request, jsonify, render_template
import jwt
import datetime
import json
import os
import pandas as pd
from functools import wraps
from flask_cors import CORS
from openai import OpenAI

AIModel = "gpt-4.1-mini"
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
CORS(app)

def load_json(path):
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {}

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        if not token:
            return jsonify({'error': 'Token missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            if data.get("username") != "admin":
                return jsonify({'error': 'Admin access only'}), 403
            request.user = data
        except:
            return jsonify({'error': 'Token invalid'}), 401

        return f(*args, **kwargs)
    return decorated


@app.route('/')
def index():
    return render_template('splash.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/splash')
def splash():
    return render_template('splash.html')

@app.route('/login.html')
def login_page():
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login():
    credentials = request.get_json()
    username = credentials.get('username')
    password = credentials.get('password')
    config = load_json('config.json')
    users = config.get('users', [])
    for user in users:
        if user['username'] == username and user['password'] == password:
            token = jwt.encode({
                'username': username,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            return jsonify({'token': token, 'redirect': '/splash'})
    return jsonify({'error': 'Invalid credentials'}), 401

#load intro.md content
@app.route('/api/intro')
def get_intro_markdown():
    path = os.path.join("static", "about", "intro.md")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# UPDATED app.py to compute ratios using reshaped_data.csv and Ratio.xlsx

@app.route('/api/years/<symbol>')

def get_years(symbol):
    try:
        df = pd.read_csv("reshaped_data.csv")
        symbol = symbol.strip().upper()
        years = df[df["Symbol"].str.upper() == symbol]["year"].dropna().unique()
        years = sorted(map(int, years), reverse=True)
        return jsonify({"years": years})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    data = request.get_json()
    company = data.get("company_name")
    year = str(data.get("fiscal_year"))
    
    if not company or not year:
        return jsonify({"error": "Missing company name or fiscal year"}), 400

    cache = load_json("search_cache.json")
    archive = load_json("archive.json")
    config = load_json("config.json")
    #nlp = 0
    cache_key = f"{company}_{year}"
    print("[LOG] Cache Key:", cache_key)
    texualreport = ""
    if cache_key in cache:
        print("[LOG] Cache hit for", cache_key)
        result = cache[cache_key]
    else:
        df = pd.read_csv("data.csv")
        row = df[(df['MNEMONIC'].str.lower().str.strip() == company.lower().strip()) & (df['year'].astype(str) == year)]

        if row.empty:
            print("[LOG] No match in data.csv, continuing with reshaped_data only")
            record = {"MNEMONIC": company, "year": year}
            symbol = company  # fallback
        else:
            record = row.iloc[0].to_dict()
            print("[LOG] Loaded record:", record)
            symbol = record.get("MNEMONIC")
            if not symbol:
                return jsonify({"error": "Symbol not found in data"}), 404
            symbol = symbol.strip().rstrip('.')
            texualreport = record.get("full_report_sentence")
            

        fields = config.get("fields", [])
        # field_lines = "\n".join(f"{key.capitalize()}: {record.get(key, 'N/A')}" for key in fields)
        field_lines = "\n".join(f"{key.capitalize()}: {record.get(key, 'N/A')}" 
                         for key in fields 
                         if key != "full_report_sentence")

        ratios_df = pd.read_excel("Ratio.xlsx")
        all_reshape_df = pd.read_csv("reshaped_data.csv")
        #Filter current year
        reshape_df = all_reshape_df[
            (all_reshape_df['Symbol'] == symbol) &
            (all_reshape_df['year'].astype(str) == year)
        ]
        metric_values = reshape_df.set_index("Financial Metrics")["amount"].to_dict()

        # Filter previous year
        reshape_dfbefore = all_reshape_df[
            (all_reshape_df['Symbol'] == symbol) &
            (all_reshape_df['year'].astype(str) == str(int(year) - 1))
        ]
        metric_values_before = reshape_dfbefore.set_index("Financial Metrics")["amount"].to_dict()


        from collections import defaultdict
        computed_ratios = []
        category_ratios = defaultdict(list)

        for _, row in ratios_df.iterrows():
            formula = str(row.get("Formula"))
            ratio_name = row.get("Ratio")
            category = row.get("Category")
            if pd.isna(formula) or '[' in formula or ']' in formula:
                continue

            try:
                temp_formula = formula
                temp_formula_before = formula
                for metric in metric_values:
                    temp_formula = temp_formula.replace(metric, str(metric_values[metric]))
                for metricbefore in metric_values_before:
                    temp_formula_before = temp_formula_before.replace(metricbefore, str(metric_values_before[metricbefore]))   

                value = eval(temp_formula)
                value_before = eval(temp_formula_before)
                ratio_data = {
                    "ratio": ratio_name,
                    "category": category,
                    "formula": formula,
                    "evaluated": temp_formula,
                    "value": value,
                    "value_before_year":value_before
                }
                computed_ratios.append(ratio_data)
                category_ratios[category].append(ratio_data)
            except Exception as e:
                computed_ratios.append({
                    "ratio": ratio_name,
                    "category": category,
                    "formula": formula,
                    "evaluated": temp_formula,
                    "error": str(e)
                })

        client = OpenAI(api_key=config.get("openai_api_key"))
        category_summaries = {}
        category_ratios["summary"].append({
                    "ratio": "summary",
                    "category": "summary",
                    "formula": "",
                    "evaluated": "",
                    "value": 0,
                    "value_before_year":0
                })
        # category_ratios["nlp"].append({
        #             "ratio": "nlp",
        #             "category": "nlp",
        #             "formula": "",
        #             "evaluated": "",
        #             "value": nlp,
        #             "value_before_year":0
        #         })
        category_verdicts = {}
        
        for category, ratios in category_ratios.items():
            if category == "summary":
                continue

            

            if category in config["ratio_prompt"]:
                ratios_text = "\n".join(
                    f"- {r['ratio']} (current year): {r['value']}\n- {r['ratio']} (previous year): {r.get('value_before_year', 'N/A')}"
                    for r in ratios if 'value' in r
                )
                cat_prompt = (
                    f"You are a financial analyst. Analyze the company's performance in the category of '{category}'.\n"
                    f"The following ratios were calculated:\n{ratios_text}\n\n"
                    f"{config['ratio_prompt'][category]}"
                    "Give your answer in two parts:\n"
                    "1. A 10-line summary.\n"
                    "2. On a new line, give a performance score for the company based on the analysis. Write exactly: Score: <number between 0 and 100>. No emojis or extra text."
                )
                response = client.chat.completions.create(
                    model=AIModel,
                    messages=[
                        {"role": "system", "content": "You are a financial analyst."},
                        {"role":"user","content":f"this texual report : {texualreport}"},
                        {"role": "user", "content": cat_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                import re

                response_text = response.choices[0].message.content.strip()
                summary_text = re.sub(r"Score\s*:\s*\d{1,3}", "", response_text).strip()

                score_match = re.search(r"Score\s*:\s*(\d{1,3})", response_text)
                score = int(score_match.group(1)) if score_match else 50  # fallback

                category_summaries[category] = summary_text
                category_verdicts[category] = score  # store as numeric score now
            else:       
                ratios_text = "\n".join(
                    f"- {r['ratio']} (current year): {r['value']}\n- {r['ratio']} (previous year): {r.get('value_before_year', 'N/A')}"
                    for r in ratios if 'value' in r
                )
                cat_prompt = (
                    f"You are a financial analyst. Analyze the company's performance in the category of '{category}'.\n"
                    f"The following ratios were calculated:\n{ratios_text}\n\n"
                    f"Provide a concise 10-line summary of what this indicates about the company's financial health in this category."
                )
                response = client.chat.completions.create(
                    model=AIModel,
                    messages=[
                        {"role": "system", "content": "You are a financial analyst."},
                        {"role": "user", "content": cat_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                category_summaries[category] = response.choices[0].message.content


        # After all interpretations, synthesize summary from them
        if "summary" in config["ratio_prompt"]:
            summary_input = (
                f"ROE Interpretation:\n{category_summaries.get('Detailed Analysis of ROE', '')}\n\n"
                f"ROE Driver Interpretation:\n{category_summaries.get('Detailed Analysis of ROE Drivers', '')}\n\n"
                f"Risk Interpretation:\n{category_summaries.get('Detailed Analysis of Risk', '')}\n\n"
                f"{config['ratio_prompt']['summary']}"
                "\n\nGive your answer in two parts:\n"
                "1. A 10-line summary.\n"
                "2. On a new line, give a performance score for the company based on the analysis. Write exactly: Score: <number between 0 and 100>. No emojis or extra text."
            )
            summary_response = client.chat.completions.create(
                model=AIModel,
                messages=[
                    {"role": "system", "content": config.get("default_prompt", "You are a financial analyst.")},
                    {"role": "user", "content": summary_input}
                    ],
                    temperature=0.7,
                    max_tokens=1000
            )
            import re
            summary_output = summary_response.choices[0].message.content.strip()
            summary_text = re.sub(r"Score\s*:\s*\d{1,3}", "", summary_output).strip()
            score_match = re.search(r"Score\s*:\s*(\d{1,3})", summary_output)
            summary_score = int(score_match.group(1)) if score_match else 50  # fallback if not found

            category_summaries["summary"] = summary_text
            category_verdicts["summary"] = summary_score
        overall_prompt = (
            config.get("default_prompt", "You are a financial analyst.") + "\n" +
            f"Analyze the overall financial performance of {company} in fiscal year {year}.\n" +
            field_lines + "\n\n" +
            "All Ratios computed:\n" +
            "\n".join(f"- {r['ratio']}: {r.get('value', 'Error')}" for r in computed_ratios if 'value' in r)
        )
        response = client.chat.completions.create(
            model=AIModel,
            messages=[
                {"role": "system", "content": config.get("default_prompt", "You are a financial analyst.")},
                {"role": "user", "content": overall_prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        overall_summary = response.choices[0].message.content
        #overall_summary
        result = {
            "summary": '',
            "category_summaries": category_summaries,
            "verdicts": category_verdicts,
            "raw_data": record,
            "ratios": computed_ratios
        }

        cache[cache_key] = result
        save_json("search_cache.json", cache)

    if not any(item["company_name"] == company and str(item["fiscal_year"]) == year for item in archive):
        archive.append({
            "company_name": company,
            "fiscal_year": year,
            "result": result
        })
        save_json("archive.json", archive)

    return jsonify({"result": result})




@app.route('/api/archive', methods=['GET'])
@admin_required
def archive():
    data = load_json('archive.json')
    return jsonify({'archive': data})

@app.route('/api/archive/delete', methods=['POST'])
@admin_required
def delete_archive_entry():
    data = request.get_json()
    company_name = data.get('company_name')
    fiscal_year = str(data.get('fiscal_year'))

    if not company_name or not fiscal_year:
        return jsonify({'error': 'Missing company_name or fiscal_year'}), 400

    # Delete from archive.json
    archive = load_json('archive.json')
    updated_archive = [entry for entry in archive if not (entry['company_name'] == company_name and str(entry['fiscal_year']) == fiscal_year)]
    save_json('archive.json', updated_archive)

    # Delete from search_cache.json
    cache_key = f"{company_name}_{fiscal_year}"
    cache = load_json('search_cache.json')
    if cache_key in cache:
        del cache[cache_key]
        save_json('search_cache.json', cache)

    return jsonify({'success': True})


from flask import send_from_directory

@app.route('/api/about')
def get_about_markdown():
    path = os.path.join("static", "about", "about.md")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/funding')
def get_funding_markdown():
    path = os.path.join("static", "about", "funding.md")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.route('/api/config', methods=['GET', 'POST'])
@admin_required
def config():
    current = load_json('config.json')
    if request.method == 'GET':
        return jsonify({
            'openai_api_key': current.get('openai_api_key'),
            'default_prompt': current.get('default_prompt'),
            'fields': current.get('fields', []),
            'users': current.get('users', []),
            'ratio_prompt': current.get('ratio_prompt', {})
        })
    
    incoming = request.get_json()
    current['openai_api_key'] = incoming.get('openai_api_key', current.get('openai_api_key'))
    current['default_prompt'] = incoming.get('default_prompt', current.get('default_prompt'))
    current['fields'] = incoming.get('fields', current.get('fields', []))
    save_json('config.json', current)
    return jsonify({'success': True})

@app.route("/api/config/prompts", methods=["POST"])
@admin_required
def update_prompts():

    data = request.get_json()
    new_prompts = data.get("prompts", {})

    config = load_json("config.json")
    config["ratio_prompt"] = new_prompts
    save_json("config.json", config)

    return jsonify({"status": "updated"})


@app.route('/api/ratios', methods=['GET', 'POST'])
@admin_required
def ratios():
    if request.method == 'GET':
        try:
            df = pd.read_excel("Ratio.xlsx", header=0)
            df.columns = df.columns.str.strip()
            return jsonify(df.to_dict(orient="records"))
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    
    data = request.get_json()
    try:
        df = pd.DataFrame(data)
        df.to_excel("Ratio.xlsx", index=False)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['POST', 'DELETE'])
@admin_required
def users():
    
    config = load_json('config.json')
    users = config.get('users', [])
    data = request.get_json()
    username = data.get('username')
    if request.method == 'POST':
        password = data.get('password')
        if any(u['username'] == username for u in users):
            return jsonify({'error': 'User already exists'}), 400
        users.append({'username': username, 'password': password})
    elif request.method == 'DELETE':
        if username == 'admin':
            return jsonify({'error': 'Cannot delete admin'}), 400
        users = [u for u in users if u['username'] != username]
    config['users'] = users
    save_json('config.json', config)
    return jsonify({'success': True})

@app.route('/api/companies')
def companies():
    df = pd.read_csv('data.csv')
    names = df['full_report_sentence'].dropna().tolist()
    candidates = {line.split()[0] for line in names if len(line.split()) > 0}
    return jsonify({'companies': sorted(candidates)})

@app.route('/api/disclaimer')
def get_disclaimer_markdown():
    path = os.path.join("static", "about", "disclaimer.md")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
