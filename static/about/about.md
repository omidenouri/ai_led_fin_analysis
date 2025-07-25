# The framework we use is as follow:

1. **We start with the analysis of the firm’s Return on Investment** – How much money the company generates relative to the shareholders’ investment in the business?

**Measures**: ROE (Return on Equity)

**Why this metric is important**: it measures value created by the business (a return on shareholders’ investment similar to the interest on the money put in a bank.
We supplement ROE analysis with NLP analysis of the annual report's textual content to determine whether future ROA will increase or decline.

NLP measures of future earnings: **Sentiment, Forward-looking information** (calculated)
Using AI and both financial and non-financial indicators, we predict what future ROE will be: predict changes in ROA over the next quarter and one year (AI).

2. **Then we analyse what drives Return on Investment**
ROE is driven by how well the business is using its assets (asset efficiency or asset turnover) and how profitably it sells its products (profit margin)

**Asset turnover:** shows how well a company uses what it owns (like buildings, equipment, and inventory) to make money from sales. A higher asset turnover means the business is making more sales for each dollar of assets it has—basically, it's using its stuff efficiently to bring in revenue.

**Profit margin:** Profit margin shows how much money a company keeps from sales after covering its costs. It’s like saying, “For every pound we make, here’s how much we actually keep as profit.” A higher profit margin means the business is earning more from each sale

**Gearing:** Measures how much debt the company is using and captures financial risk of the business and captures financial risk (we will discuss gearing when talking about risk).

3. **Then we analyse risk using financial statement information**
Companies operate in an uncertain environment where both revenue and costs can fluctuate greatly from year to year.
Changes in market conditions (e.g., tariffs), customer preferences, or competition can affect a firm’s operations. This means that future financial performance can be much different from today’s performance.
Shareholders need to compare the financial performance to the risks inherent in the firm’s operation to understand if the return is high enough to justify the risk. The higher the risk, the higher the return a company needs to generate to entice shareholders to provide financing for the firm.

![risk and return line graph](static/about/RiskReturn_Graph.PNG)

Risk has multiple dimensions. We are looking at four measures of risk.

**Financial risk:** Measures how much debt (E.g., bank loans) the company uses to support its operations. Note that higher levels of debt have a direct positive impact on financial performance as long as financial return is higher than the interest rate. Gearing is also called a multiplier of financial performance: a company can increase ROE by taking on more debt even if the products, sales, margin are the same.

**Measures:** Gearing and NLP measures based on analysis of financial risk
**Gearing is also one of the components of ROA.**

**Solvency:** Does the company have enough cash to continue and absorb unexpected shocks?

**Measures:** an index measure based on quick ratio, current ratio, cash ratio

**Business risk:** What are the operating risks the company faces.

**Measures:** NLP measures of Legal & Regulatory Risk, Tax Risk, Other Systematic Risk and Other Idiosyncratic Risk <small>(campbell et al. 2014)</small>

**Reporting risk:** Because we take information from financial statements, we want to gauge its quality. How clearly, accurately, and honestly a company presents its financial and business information in its annual report. High-quality reporting means the information is easy to understand, complete, and gives a true picture of the company’s performance, risks, and future outlook—helping investors and others make informed decisions.

**Measures:** NLP measures of sentiment, specificity, forward-looking information, sentence length, depth, and unfamiliarity <small>(Loughran & McDonald 2011, Muslu et al.2015, Hope et al. 2016)</small>

## 📚 References

<small>

- Hope, O. K., Hu, D., & Lu, H. (2016). *The benefits of specific risk-factor disclosures*. **Review of Accounting Studies**, 21(4), 1005–1045.  
- Loughran, T., & McDonald, B. (2011). *When is a liability not a liability? Textual analysis, dictionaries, and 10‐Ks*. **The Journal of Finance**, 66(1), 35–65.  
- Muslu, V., Radhakrishnan, S., Subramanyam, K. R., & Lim, D. (2015). *Forward-looking MD&A disclosures and the information environment*. **Management Science**, 61(5), 931–948.  
- Campbell, J. L., Chen, H., Dhaliwal, D. S., Lu, H. M., & Steele, L. B. (2014). *The information content of mandatory risk factor disclosures in corporate filings*. **Review of Accounting Studies**, 19(1), 396–455.

</small>