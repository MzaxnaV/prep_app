// CFA Level 1 Curriculum: all 93 modules with lessons
// subjectFull maps to the SubjectProgress.subject names used in the app

export const SUBJECT_ABBR_TO_FULL = {
  'Quant': 'Quantitative Methods',
  'Econ': 'Economics',
  'Corp': 'Corporate Issuers',
  'FSA': 'Financial Statement Analysis',
  'Equity': 'Equity Investments',
  'F Income': 'Fixed Income',
  'Derivatives': 'Derivatives',
  'Alt Inv': 'Alternative Investments',
  'Port Mgmt': 'Portfolio Management',
  'Ethics': 'Ethics',
};

export const CFA_CURRICULUM = [
  // ── Quantitative Methods (1-11) ──────────────────────────────────────────
  {
    id: 1, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Rates and Returns',
    lessons: [
      { num: 1, title: 'Interest Rates and Time Value of Money' },
      { num: 2, title: 'Rates of Return' },
      { num: 3, title: 'Money-Weighted and Time-Weighted Return' },
      { num: 4, title: 'Annualized Return' },
      { num: 5, title: 'Other Major Return Measures and Their Applications' },
    ],
  },
  {
    id: 2, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Time Value of Money in Finance',
    lessons: [
      { num: 1, title: 'Time Value of Money in Fixed Income and Equity' },
      { num: 2, title: 'Implied Return and Growth' },
      { num: 3, title: 'Cash Flow Additivity' },
    ],
  },
  {
    id: 3, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Statistical Measures of Asset Returns',
    lessons: [
      { num: 1, title: 'Measures of Central Tendency and Location' },
      { num: 2, title: 'Measures of Dispersion' },
      { num: 3, title: 'Measures of Shape of a Distribution' },
      { num: 4, title: 'Correlation between Two Variables' },
    ],
  },
  {
    id: 4, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Probability Trees and Conditional Expectations',
    lessons: [
      { num: 1, title: 'Expected Value and Variance' },
      { num: 2, title: 'Probability Trees and Conditional Expectations' },
      { num: 3, title: "Bayes' Formula and Updating Probability Estimates" },
    ],
  },
  {
    id: 5, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Portfolio Mathematics',
    lessons: [
      { num: 1, title: 'Portfolio Expected Return and Variance of Return' },
      { num: 2, title: 'Forecasting Correlation of Returns: Covariance Given a Joint Probability Function' },
      { num: 3, title: 'Portfolio Risk Measures: Applications of the Normal Distribution' },
    ],
  },
  {
    id: 6, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Simulation Methods',
    lessons: [
      { num: 1, title: 'Lognormal Distribution and Continuous Compounding' },
      { num: 2, title: 'Monte Carlo Simulation' },
      { num: 3, title: 'Bootstrapping' },
    ],
  },
  {
    id: 7, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Estimation and Inference',
    lessons: [
      { num: 1, title: 'Sampling Methods' },
      { num: 2, title: 'Central Limit Theorem and Inference' },
      { num: 3, title: 'Bootstrapping and Empirical Sampling Distributions' },
    ],
  },
  {
    id: 8, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Hypothesis Testing',
    lessons: [
      { num: 1, title: 'Hypothesis Tests for Finance' },
      { num: 2, title: 'Tests of Return and Risk in Finance' },
      { num: 3, title: 'Parametric versus Nonparametric Tests' },
    ],
  },
  {
    id: 9, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Parametric and Non-Parametric Tests of Independence',
    lessons: [
      { num: 1, title: 'Tests Concerning Correlation' },
      { num: 2, title: 'Tests of Independence Using Contingency Table Data' },
    ],
  },
  {
    id: 10, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Simple Linear Regression',
    lessons: [
      { num: 1, title: 'Estimation of the Simple Linear Regression Model' },
      { num: 2, title: 'Assumptions of the Simple Linear Regression Model' },
      { num: 3, title: 'Hypothesis Tests in the Simple Linear Regression Model' },
      { num: 4, title: 'Prediction in the Simple Linear Regression Model' },
      { num: 5, title: 'Functional Forms for Simple Linear Regression' },
    ],
  },
  {
    id: 11, subject: 'Quant', subjectFull: 'Quantitative Methods',
    name: 'Introduction to Big Data Techniques',
    lessons: [
      { num: 1, title: 'How Is Fintech Used in Quantitative Investment Analysis?' },
      { num: 2, title: 'Advanced Analytical Tools: Artificial Intelligence and Machine Learning' },
      { num: 3, title: 'Tackling Big Data with Data Science' },
    ],
  },

  // ── Economics (12-19) ────────────────────────────────────────────────────
  {
    id: 12, subject: 'Econ', subjectFull: 'Economics',
    name: 'The Firm and Market Structures',
    lessons: [
      { num: 1, title: 'Profit Maximization: Production Breakeven, Shutdown and Economies of Scale' },
      { num: 2, title: 'Introduction to Market Structures' },
      { num: 3, title: 'Monopolistic Competition' },
      { num: 4, title: 'Oligopoly' },
      { num: 5, title: 'Determining Market Structure' },
    ],
  },
  {
    id: 13, subject: 'Econ', subjectFull: 'Economics',
    name: 'Understanding Business Cycles',
    lessons: [
      { num: 1, title: 'Overview of the Business Cycle' },
      { num: 2, title: 'Credit Cycles' },
      { num: 3, title: 'Economic Indicators over the Business Cycle' },
    ],
  },
  {
    id: 14, subject: 'Econ', subjectFull: 'Economics',
    name: 'Fiscal Policy',
    lessons: [
      { num: 1, title: 'Introduction to Monetary and Fiscal Policy' },
      { num: 2, title: 'Roles and Objectives of Fiscal Policy' },
      { num: 3, title: 'Fiscal Policy Tools' },
      { num: 4, title: 'Fiscal Policy Implementation' },
    ],
  },
  {
    id: 15, subject: 'Econ', subjectFull: 'Economics',
    name: 'Monetary Policy',
    lessons: [
      { num: 1, title: 'Role of Central Banks' },
      { num: 2, title: 'Monetary Policy Tools and Monetary Transmission' },
      { num: 3, title: 'Monetary Policy Objectives' },
      { num: 4, title: 'Interaction of Monetary and Fiscal Policy' },
    ],
  },
  {
    id: 16, subject: 'Econ', subjectFull: 'Economics',
    name: 'Introduction to Geopolitics',
    lessons: [
      { num: 1, title: 'National Governments and Political Cooperation' },
      { num: 2, title: 'Forces of Globalization' },
      { num: 3, title: 'International Trade Organizations' },
      { num: 4, title: 'Assessing Geopolitical Actors and Risk' },
      { num: 5, title: 'The Tools of Geopolitics' },
      { num: 6, title: 'Geopolitical Risk and the Investment Process' },
    ],
  },
  {
    id: 17, subject: 'Econ', subjectFull: 'Economics',
    name: 'International Trade',
    lessons: [
      { num: 1, title: 'Benefits and Costs of Trade' },
      { num: 2, title: 'Trade Restrictions and Agreements—Tariffs, Quotas, and Export Subsidies' },
      { num: 3, title: 'Trading Blocs and Regional Integration' },
    ],
  },
  {
    id: 18, subject: 'Econ', subjectFull: 'Economics',
    name: 'Capital Flows and the FX Market',
    lessons: [
      { num: 1, title: 'The Foreign Exchange Market and Exchange Rates' },
      { num: 2, title: 'Exchange Rate Regimes: Ideals and Historical Perspective' },
      { num: 3, title: 'Capital Restrictions' },
    ],
  },
  {
    id: 19, subject: 'Econ', subjectFull: 'Economics',
    name: 'Exchange Rate Calculations',
    lessons: [
      { num: 1, title: 'Cross-Rate Calculations' },
      { num: 2, title: 'Forward Rate Calculations' },
    ],
  },

  // ── Corporate Issuers (20-26) ────────────────────────────────────────────
  {
    id: 20, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Organizational Forms, Corporate Issuer Features, and Ownership',
    lessons: [
      { num: 1, title: 'Organizational Forms of Businesses' },
      { num: 2, title: 'Key Features of Corporate Issuers' },
      { num: 3, title: 'Publicly vs. Privately Owned Corporate Issuers' },
    ],
  },
  {
    id: 21, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Investors and Other Stakeholders',
    lessons: [
      { num: 1, title: 'Financial Claims of Lenders and Shareholders' },
      { num: 2, title: 'Corporate Stakeholders and Governance' },
      { num: 3, title: 'Corporate ESG Considerations' },
    ],
  },
  {
    id: 22, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Corporate Governance: Conflicts, Mechanisms, Risks, and Benefits',
    lessons: [
      { num: 1, title: 'Stakeholder Conflicts and Management' },
      { num: 2, title: 'Corporate Governance Mechanisms' },
      { num: 3, title: 'Corporate Governance Risks and Benefits' },
    ],
  },
  {
    id: 23, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Working Capital and Liquidity',
    lessons: [
      { num: 1, title: 'Cash Conversion Cycle' },
      { num: 2, title: 'Liquidity' },
      { num: 3, title: 'Managing Working Capital and Liquidity' },
    ],
  },
  {
    id: 24, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Capital Investments and Capital Allocation',
    lessons: [
      { num: 1, title: 'Capital Investments' },
      { num: 2, title: 'Capital Allocation' },
      { num: 3, title: 'Capital Allocation Principles and Pitfalls' },
      { num: 4, title: 'Real Options' },
    ],
  },
  {
    id: 25, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Capital Structure',
    lessons: [
      { num: 1, title: 'The Cost of Capital' },
      { num: 2, title: 'Factors Affecting Capital Structure' },
      { num: 3, title: 'Modigliani–Miller Capital Structure Propositions' },
      { num: 4, title: 'Optimal Capital Structure' },
    ],
  },
  {
    id: 26, subject: 'Corp', subjectFull: 'Corporate Issuers',
    name: 'Business Models',
    lessons: [
      { num: 1, title: 'Defining the Business Model' },
      { num: 2, title: 'Business Model Types' },
    ],
  },

  // ── Financial Statement Analysis (27-38) ─────────────────────────────────
  {
    id: 27, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Introduction to Financial Statement Analysis',
    lessons: [
      { num: 1, title: 'Financial Statement Analysis Framework' },
      { num: 2, title: 'Scope of Financial Statement Analysis' },
      { num: 3, title: 'Regulated Sources of Information' },
      { num: 4, title: 'Comparison of IFRS with Alternative Financial Reporting Systems' },
      { num: 5, title: 'Other Sources of Information' },
    ],
  },
  {
    id: 28, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analyzing Income Statements',
    lessons: [
      { num: 1, title: 'Revenue Recognition' },
      { num: 2, title: 'Expense Recognition' },
      { num: 3, title: 'Non-Recurring Items' },
      { num: 4, title: 'Earnings per Share' },
      { num: 5, title: 'Income Statement Ratios and Common-Size Analysis' },
    ],
  },
  {
    id: 29, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analyzing Balance Sheets',
    lessons: [
      { num: 1, title: 'Intangible Assets' },
      { num: 2, title: 'Goodwill' },
      { num: 3, title: 'Financial Instruments' },
      { num: 4, title: 'Non-Current Liabilities' },
      { num: 5, title: 'Ratios and Common-Size Analysis' },
    ],
  },
  {
    id: 30, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analyzing Statements of Cash Flows I',
    lessons: [
      { num: 1, title: 'Linkages between the Financial Statements' },
      { num: 2, title: 'The Direct Method for Cash Flows from Operating Activities' },
      { num: 3, title: 'The Indirect Method for Cash Flows from Operating Activities' },
      { num: 4, title: 'Conversion from the Indirect to Direct Method' },
      { num: 5, title: 'Cash Flows from Investing Activities' },
      { num: 6, title: 'Cash Flows from Financing Activities' },
      { num: 7, title: 'Differences in Cash Flow Statements Prepared under US GAAP versus IFRS' },
    ],
  },
  {
    id: 31, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analyzing Statements of Cash Flows II',
    lessons: [
      { num: 1, title: 'Evaluating Sources and Uses of Cash' },
      { num: 2, title: 'Ratios and Common-Size Analysis' },
      { num: 3, title: 'Free Cash Flow Measures' },
      { num: 4, title: 'Cash Flow Statement Analysis: Cash Flow Ratios' },
    ],
  },
  {
    id: 32, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analysis of Inventories',
    lessons: [
      { num: 1, title: 'Inventory Valuation' },
      { num: 2, title: 'The Effects of Inflation and Deflation on Inventories, Costs of Sales, and Gross Margin' },
      { num: 3, title: 'Presentation and Disclosure' },
    ],
  },
  {
    id: 33, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analysis of Long-Term Assets',
    lessons: [
      { num: 1, title: 'Acquisition of Intangible Assets' },
      { num: 2, title: 'Impairment and Derecognition of Assets' },
      { num: 3, title: 'Presentation and Disclosure' },
      { num: 4, title: 'Using Disclosures in Analysis' },
    ],
  },
  {
    id: 34, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Topics in Long-Term Liabilities and Equity',
    lessons: [
      { num: 1, title: 'Leases' },
      { num: 2, title: 'Financial Reporting for Postemployment and Share-Based Compensation Plans' },
      { num: 3, title: 'Presentation and Disclosure' },
    ],
  },
  {
    id: 35, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Analysis of Income Taxes',
    lessons: [
      { num: 1, title: 'Differences between Accounting Profit and Taxable Income' },
      { num: 2, title: 'Deferred Tax Assets and Liabilities' },
      { num: 3, title: 'Corporate Income Tax Rates' },
      { num: 4, title: 'Presentation and Disclosure' },
    ],
  },
  {
    id: 36, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Financial Reporting Quality',
    lessons: [
      { num: 1, title: 'Conceptual Overview' },
      { num: 2, title: 'GAAP, Decision Useful Financial Reporting' },
      { num: 3, title: 'Biased Accounting Choices' },
      { num: 4, title: 'Departures from GAAP' },
      { num: 5, title: 'Differentiate between Conservative and Aggressive Accounting' },
      { num: 6, title: 'Context for Assessing Financial Reporting Quality' },
      { num: 7, title: 'Mechanisms That Discipline Financial Reporting Quality' },
      { num: 8, title: 'Detection of Financial Reporting Quality Issues: Introduction and Presentation Choices' },
      { num: 9, title: 'Accounting Choices and Estimates' },
      { num: 10, title: 'Accounting Choices That Affect the Cash Flow Statement' },
      { num: 11, title: 'Accounting Choices that Affect Financial Reporting' },
      { num: 12, title: 'Warning Signs' },
    ],
  },
  {
    id: 37, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Financial Analysis Techniques',
    lessons: [
      { num: 1, title: 'The Financial Analysis Process' },
      { num: 2, title: 'Analytical Tools and Techniques' },
      { num: 3, title: 'Financial Ratio Analysis' },
      { num: 4, title: 'Common Size Balance Sheets and Income Statements' },
      { num: 5, title: 'Cross-Sectional, Trend Analysis, and Relationships in Financial Statements' },
      { num: 6, title: 'The Use of Graphs and Regression Analysis' },
      { num: 7, title: 'Common Ratio Categories, Interpretation, and Context' },
      { num: 8, title: 'Activity Ratios' },
      { num: 9, title: 'Liquidity Ratios' },
      { num: 10, title: 'Solvency Ratios' },
      { num: 11, title: 'Profitability Ratios' },
      { num: 12, title: 'Integrated Financial Ratio Analysis' },
      { num: 13, title: 'DuPont Analysis—The Decomposition of ROE' },
      { num: 14, title: 'Industry-Specific Financial Ratios' },
      { num: 15, title: 'Model Building and Forecasting' },
    ],
  },
  {
    id: 38, subject: 'FSA', subjectFull: 'Financial Statement Analysis',
    name: 'Introduction to Financial Statement Modeling',
    lessons: [
      { num: 1, title: 'Building a Financial Statement Model' },
      { num: 2, title: 'Behavioral Finance and Analyst Forecasts' },
      { num: 3, title: 'The Impact of Competitive Factors in Prices and Costs' },
      { num: 4, title: 'Modeling Inflation and Deflation' },
      { num: 5, title: 'The Forecast Horizon and Long-Term Forecasting' },
    ],
  },

  // ── Equity Investments (39-46) ───────────────────────────────────────────
  {
    id: 39, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Market Organization and Structure',
    lessons: [
      { num: 1, title: 'The Functions of the Financial System' },
      { num: 2, title: 'Assets and Contracts' },
      { num: 3, title: 'Securities' },
      { num: 4, title: 'Currencies, Commodities, and Real Assets' },
      { num: 5, title: 'Contracts' },
      { num: 6, title: 'Financial Intermediaries' },
      { num: 7, title: 'Securitizers, Depository Institutions and Insurance Companies' },
      { num: 8, title: 'Settlement and Custodial Services and Summary' },
      { num: 9, title: 'Positions and Short Positions' },
      { num: 10, title: 'Leveraged Positions' },
      { num: 11, title: 'Orders and Execution Instructions' },
      { num: 12, title: 'Validity Instructions and Clearing Instructions' },
      { num: 13, title: 'Primary Security Markets' },
      { num: 14, title: 'Secondary Security Market and Contract Market Structures' },
      { num: 15, title: 'Well-functioning Financial Systems' },
      { num: 16, title: 'Market Regulation' },
    ],
  },
  {
    id: 40, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Security Market Indexes',
    lessons: [
      { num: 1, title: 'Index Definition and Calculations of Value and Returns' },
      { num: 2, title: 'Index Construction' },
      { num: 3, title: 'Index Management: Rebalancing and Reconstitution' },
      { num: 4, title: 'Uses of Market Indexes' },
      { num: 5, title: 'Equity Indexes' },
      { num: 6, title: 'Fixed-Income Indexes' },
      { num: 7, title: 'Indexes for Alternative Investments' },
    ],
  },
  {
    id: 41, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Market Efficiency',
    lessons: [
      { num: 1, title: 'The Concept of Market Efficiency' },
      { num: 2, title: 'Factors Affecting Market Efficiency Including Trading Costs' },
      { num: 3, title: 'Forms of Market Efficiency' },
      { num: 4, title: 'Implications of the Efficient Market Hypothesis' },
      { num: 5, title: 'Market Pricing Anomalies - Time Series and Cross-Sectional' },
      { num: 6, title: 'Other Anomalies, Implications of Market Pricing Anomalies' },
      { num: 7, title: 'Behavioral Finance' },
    ],
  },
  {
    id: 42, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Overview of Equity Securities',
    lessons: [
      { num: 1, title: 'Importance of Equity Securities' },
      { num: 2, title: 'Characteristics of Equity Securities' },
      { num: 3, title: 'Private Versus Public Equity Securities' },
      { num: 4, title: 'Non-Domestic Equity Securities' },
      { num: 5, title: 'Risk and Return Characteristics' },
      { num: 6, title: 'Equity and Company Value' },
    ],
  },
  {
    id: 43, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Company Analysis: Past and Present',
    lessons: [
      { num: 1, title: 'Company Research Reports' },
      { num: 2, title: 'Determining the Business Model' },
      { num: 3, title: 'Revenue Analysis' },
      { num: 4, title: 'Operating Profitability and Working Capital Analysis' },
      { num: 5, title: 'Capital Investments and Capital Structure' },
    ],
  },
  {
    id: 44, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Industry and Competitive Analysis',
    lessons: [
      { num: 1, title: 'Uses of Industry Analysis' },
      { num: 2, title: 'Industry Classification' },
      { num: 3, title: 'Industry Survey' },
      { num: 4, title: 'Industry Structure and External Influences' },
      { num: 5, title: 'Competitive Positioning' },
    ],
  },
  {
    id: 45, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Company Analysis: Forecasting',
    lessons: [
      { num: 1, title: 'Forecast Objects, Principles, and Approaches' },
      { num: 2, title: 'Forecasting Revenues' },
      { num: 3, title: 'Forecasting Operating Expenses and Working Capital' },
      { num: 4, title: 'Forecasting Capital Investments and Capital Structure' },
      { num: 5, title: 'Scenario Analysis' },
    ],
  },
  {
    id: 46, subject: 'Equity', subjectFull: 'Equity Investments',
    name: 'Equity Valuation: Concepts and Basic Tools',
    lessons: [
      { num: 1, title: 'Estimated Value and Market Price' },
      { num: 2, title: 'Categories of Equity Valuation Models' },
      { num: 3, title: 'Background for the Dividend Discount Model' },
      { num: 4, title: 'Dividend Discount Model (DDM) and Free-Cash-Flow-to-Equity Model (FCFE)' },
      { num: 5, title: 'Preferred Stock Valuation' },
      { num: 6, title: 'The Gordon Growth Model' },
      { num: 7, title: 'Multistage Dividend Discount Models' },
      { num: 8, title: 'Multiplier Models and Relationship Among Price Multiples, Present Value Models, and Fundamentals' },
      { num: 9, title: 'Method of Comparables and Valuation Based on Price Multiples' },
      { num: 10, title: 'Enterprise Value' },
      { num: 11, title: 'Asset-Based Valuation' },
    ],
  },

  // ── Fixed Income (47-65) ─────────────────────────────────────────────────
  {
    id: 47, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Instrument Features',
    lessons: [
      { num: 1, title: 'Features of Fixed-Income Securities' },
      { num: 2, title: 'Bond Indentures and Covenants' },
    ],
  },
  {
    id: 48, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Cash Flows and Types',
    lessons: [
      { num: 1, title: 'Fixed-Income Cash Flow Structures' },
      { num: 2, title: 'Fixed-Income Contingency Provisions' },
      { num: 3, title: 'Legal, Regulatory, and Tax Considerations' },
    ],
  },
  {
    id: 49, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Issuance and Trading',
    lessons: [
      { num: 1, title: 'Fixed-Income Segments, Issuers, and Investors' },
      { num: 2, title: 'Fixed-Income Indexes' },
      { num: 3, title: 'Primary and Secondary Fixed-Income Markets' },
    ],
  },
  {
    id: 50, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Markets for Corporate Issuers',
    lessons: [
      { num: 1, title: 'Short-Term Funding Alternatives' },
      { num: 2, title: 'Repurchase Agreements' },
      { num: 3, title: 'Long-Term Corporate Debt' },
    ],
  },
  {
    id: 51, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Markets for Government Issuers',
    lessons: [
      { num: 1, title: 'Sovereign Debt' },
      { num: 2, title: 'Sovereign Debt Issuance and Trading' },
      { num: 3, title: 'Non-Sovereign, Quasi-Government, and Supranational Agency Debt' },
    ],
  },
  {
    id: 52, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Bond Valuation: Prices and Yields',
    lessons: [
      { num: 1, title: 'Bond Pricing and the Time Value of Money' },
      { num: 2, title: 'Relationships between Bond Prices and Bond Features' },
      { num: 3, title: 'Matrix Pricing' },
    ],
  },
  {
    id: 53, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Yield and Yield Spread Measures for Fixed-Rate Bonds',
    lessons: [
      { num: 1, title: 'Periodicity and Annualized Yields' },
      { num: 2, title: 'Other Yield Measures, Conventions, and Accounting for Embedded Options' },
      { num: 3, title: 'Yield Spread Measures for Fixed-Rate Bonds and Matrix Pricing' },
    ],
  },
  {
    id: 54, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Yield and Yield Spread Measures for Floating-Rate Instruments',
    lessons: [
      { num: 1, title: 'Yield and Yield Spread Measures for Floating-Rate Notes' },
      { num: 2, title: 'Yield Measures for Money Market Instruments' },
    ],
  },
  {
    id: 55, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'The Term Structure of Interest Rates: Spot, Par, and Forward Curves',
    lessons: [
      { num: 1, title: 'Maturity Structure of Interest Rates and Spot Rates' },
      { num: 2, title: 'Par and Forward Rates' },
      { num: 3, title: 'Spot, Par, and Forward Yield Curves and Interpreting Their Relationship' },
    ],
  },
  {
    id: 56, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Interest Rate Risk and Return',
    lessons: [
      { num: 1, title: 'Sources of Return from Investing in a Fixed-Rate Bond' },
      { num: 2, title: 'Investment Horizon and Interest Rate Risk' },
      { num: 3, title: 'Macaulay Duration' },
    ],
  },
  {
    id: 57, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Yield-Based Bond Duration Measures and Properties',
    lessons: [
      { num: 1, title: 'Modified Duration' },
      { num: 2, title: 'Money Duration and Price Value of a Basis Point' },
      { num: 3, title: 'Properties of Duration' },
    ],
  },
  {
    id: 58, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Yield-Based Bond Convexity and Portfolio Properties',
    lessons: [
      { num: 1, title: 'Bond Convexity and Convexity Adjustment' },
      { num: 2, title: 'Bond Risk and Return Using Duration and Convexity' },
      { num: 3, title: 'Portfolio Duration and Convexity' },
    ],
  },
  {
    id: 59, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Curve-Based and Empirical Fixed-Income Risk Measures',
    lessons: [
      { num: 1, title: 'Curve-Based Interest Rate Risk Measures' },
      { num: 2, title: 'Bond Risk and Return Using Curve-Based Duration and Convexity' },
      { num: 3, title: 'Key Rate Duration as a Measure of Yield Curve Risk' },
      { num: 4, title: 'Empirical Duration' },
    ],
  },
  {
    id: 60, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Credit Risk',
    lessons: [
      { num: 1, title: 'Sources of Credit Risk' },
      { num: 2, title: 'Credit Rating Agencies and Credit Ratings' },
      { num: 3, title: 'Factors Impacting Yield Spreads' },
    ],
  },
  {
    id: 61, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Credit Analysis for Government Issuers',
    lessons: [
      { num: 1, title: 'Sovereign Credit Analysis' },
      { num: 2, title: 'Non-Sovereign Credit Risk' },
    ],
  },
  {
    id: 62, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Credit Analysis for Corporate Issuers',
    lessons: [
      { num: 1, title: 'Assessing Corporate Creditworthiness' },
      { num: 2, title: 'Financial Ratios in Corporate Credit Analysis' },
      { num: 3, title: 'Seniority Rankings, Recovery Rates, and Credit Ratings' },
    ],
  },
  {
    id: 63, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Fixed-Income Securitization',
    lessons: [
      { num: 1, title: 'The Benefits of Securitization' },
      { num: 2, title: 'The Securitization Process' },
    ],
  },
  {
    id: 64, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Asset-Backed Security (ABS) Instrument and Market Features',
    lessons: [
      { num: 1, title: 'Covered Bonds' },
      { num: 2, title: 'ABS Structures to Address Credit Risk' },
      { num: 3, title: 'Non-Mortgage Asset-Backed Securities' },
      { num: 4, title: 'Collateralized Debt Obligations' },
    ],
  },
  {
    id: 65, subject: 'F Income', subjectFull: 'Fixed Income',
    name: 'Mortgage-Backed Security (MBS) Instrument and Market Features',
    lessons: [
      { num: 1, title: 'Time Tranching' },
      { num: 2, title: 'Mortgage Loans and Their Characteristic Features' },
      { num: 3, title: 'Residential Mortgage-Backed Securities (RMBS)' },
      { num: 4, title: 'Commercial Mortgage-Backed Securities (CMBS)' },
    ],
  },

  // ── Derivatives (66-75) ──────────────────────────────────────────────────
  {
    id: 66, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Derivative Instrument and Derivative Market Features',
    lessons: [
      { num: 1, title: 'Derivative Features' },
      { num: 2, title: 'Derivative Underlyings' },
      { num: 3, title: 'Derivative Markets' },
    ],
  },
  {
    id: 67, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Forward Commitment and Contingent Claim Features and Instruments',
    lessons: [
      { num: 1, title: 'Forwards, Futures and Swaps' },
      { num: 2, title: 'Futures' },
      { num: 3, title: 'Swaps' },
      { num: 4, title: 'Options' },
      { num: 5, title: 'Credit Derivatives' },
      { num: 6, title: 'Forward Commitments vs. Contingent Claims' },
    ],
  },
  {
    id: 68, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Derivative Benefits, Risks, and Issuer and Investor Uses',
    lessons: [
      { num: 1, title: 'Derivative Benefits' },
      { num: 2, title: 'Derivative Risks' },
      { num: 3, title: 'Issuer Use of Derivatives' },
      { num: 4, title: 'Investor Use of Derivatives' },
    ],
  },
  {
    id: 69, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Arbitrage, Replication, and the Cost of Carry in Pricing Derivatives',
    lessons: [
      { num: 1, title: 'Arbitrage' },
      { num: 2, title: 'Replication' },
      { num: 3, title: 'Costs and Benefits Associated with Owning the Underlying' },
    ],
  },
  {
    id: 70, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Pricing and Valuation of Forward Contracts and for an Underlying with Varying Maturities',
    lessons: [
      { num: 1, title: 'Pricing and Valuation of Forward Contracts' },
      { num: 2, title: 'Pricing and Valuation of Interest Rate Forward Contracts' },
    ],
  },
  {
    id: 71, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Pricing and Valuation of Futures Contracts',
    lessons: [
      { num: 1, title: 'Pricing of Futures Contracts at Inception' },
      { num: 2, title: 'MTM Valuation: Forwards versus Futures' },
      { num: 3, title: 'Interest Rate Futures versus Forward Contracts' },
      { num: 4, title: 'Forward and Futures Price Differences' },
      { num: 5, title: 'Interest Rate Forward and Futures Price Differences' },
      { num: 6, title: 'Effect of Central Clearing of OTC Derivatives' },
    ],
  },
  {
    id: 72, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Pricing and Valuation of Interest Rates and Other Swaps',
    lessons: [
      { num: 1, title: 'Swaps versus Forwards' },
      { num: 2, title: 'Swap Values and Prices' },
    ],
  },
  {
    id: 73, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Pricing and Valuation of Options',
    lessons: [
      { num: 1, title: 'Option Value Relative to the Underlying Spot Price' },
      { num: 2, title: 'Option Exercise Value' },
      { num: 3, title: 'Option Moneyness' },
      { num: 4, title: 'Option Time Value' },
      { num: 5, title: 'Arbitrage' },
      { num: 6, title: 'Replication' },
      { num: 7, title: 'Factors Affecting Option Value' },
    ],
  },
  {
    id: 74, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Option Replication Using Put–Call Parity',
    lessons: [
      { num: 1, title: 'Put-Call Parity' },
      { num: 2, title: 'Option Strategies Based on Put-Call Parity' },
      { num: 3, title: 'Put-Call Forward Parity and Option Applications' },
      { num: 4, title: 'Put-Call Forward Parity' },
      { num: 5, title: 'Option Put-Call Parity Applications: Firm Value' },
    ],
  },
  {
    id: 75, subject: 'Derivatives', subjectFull: 'Derivatives',
    name: 'Valuing a Derivative Using a One-Period Binomial Model',
    lessons: [
      { num: 1, title: 'Binomial Valuation' },
      { num: 2, title: 'The Binomial Model' },
      { num: 3, title: 'Pricing a European Call Option' },
      { num: 4, title: 'Risk Neutrality' },
    ],
  },

  // ── Alternative Investments (76-82) ──────────────────────────────────────
  {
    id: 76, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Alternative Investment Features, Methods, and Structures',
    lessons: [
      { num: 1, title: 'Alternative Investment Features' },
      { num: 2, title: 'Alternative Investment Methods' },
      { num: 3, title: 'Alternative Investment Structures' },
    ],
  },
  {
    id: 77, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Alternative Investment Performance and Returns',
    lessons: [
      { num: 1, title: 'Alternative Investment Performance' },
      { num: 2, title: 'Alternative Investment Returns' },
    ],
  },
  {
    id: 78, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Investments in Private Capital: Equity and Debt',
    lessons: [
      { num: 1, title: 'Private Equity Investment Characteristics' },
      { num: 2, title: 'Private Debt Investment Characteristics' },
      { num: 3, title: 'Diversification Benefits of Private Capital' },
    ],
  },
  {
    id: 79, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Real Estate and Infrastructure',
    lessons: [
      { num: 1, title: 'Real Estate Features' },
      { num: 2, title: 'Real Estate Investment Characteristics' },
      { num: 3, title: 'Infrastructure Investment Features' },
      { num: 4, title: 'Infrastructure Investment Characteristics' },
    ],
  },
  {
    id: 80, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Natural Resources',
    lessons: [
      { num: 1, title: 'Natural Resources Investment Feature' },
      { num: 2, title: 'Commodity Investment Form' },
      { num: 3, title: 'Natural Resource Investment Risk, Return, and Diversification' },
    ],
  },
  {
    id: 81, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Hedge Funds',
    lessons: [
      { num: 1, title: 'Hedge Fund Investment Features' },
      { num: 2, title: 'Hedge Fund Investment Forms' },
      { num: 3, title: 'Hedge Fund Investment Risk, Return, and Diversification' },
    ],
  },
  {
    id: 82, subject: 'Alt Inv', subjectFull: 'Alternative Investments',
    name: 'Introduction to Digital Assets',
    lessons: [
      { num: 1, title: 'Distributed Ledger Technology' },
      { num: 2, title: 'Digital Asset Investment Features' },
      { num: 3, title: 'Digital Asset Investment Forms' },
      { num: 4, title: 'Digital Asset Investment Risk, Return, and Diversification' },
    ],
  },

  // ── Portfolio Management (83-88) ─────────────────────────────────────────
  {
    id: 83, subject: 'Port Mgmt', subjectFull: 'Portfolio Management',
    name: 'Portfolio Risk and Return: Part I',
    lessons: [
      { num: 1, title: 'Historical Return and Risk' },
      { num: 2, title: 'Other Investment Characteristics' },
      { num: 3, title: 'Risk Aversion and Portfolio Selection' },
      { num: 4, title: 'Utility Theory and Indifference Curves' },
      { num: 5, title: 'Application of Utility Theory to Portfolio Selection' },
      { num: 6, title: 'Portfolio Risk & Portfolio of Two Risky Assets' },
      { num: 7, title: 'Portfolio of Many Risky Assets' },
      { num: 8, title: 'The Power of Diversification' },
      { num: 9, title: 'Efficient Frontier: Investment Opportunity Set & Minimum Variance Portfolios' },
      { num: 10, title: 'Efficient Frontier: A Risk-Free Asset and Many Risky Assets' },
      { num: 11, title: 'Efficient Frontier: Optimal Investor Portfolio' },
    ],
  },
  {
    id: 84, subject: 'Port Mgmt', subjectFull: 'Portfolio Management',
    name: 'Portfolio Risk and Return: Part II',
    lessons: [
      { num: 1, title: 'Capital Market Theory: Risk-Free and Risky Assets' },
      { num: 2, title: 'Capital Market Theory: The Capital Market Line' },
      { num: 3, title: 'Capital Market Theory: CML - Leveraged Portfolios' },
      { num: 4, title: 'Systematic and Nonsystematic Risk' },
      { num: 5, title: 'Return Generating Models' },
      { num: 6, title: 'Calculation and Interpretation of Beta' },
      { num: 7, title: 'Capital Asset Pricing Model: Assumptions and the Security Market Line' },
      { num: 8, title: 'Capital Asset Pricing Model: Applications' },
      { num: 9, title: 'Beyond CAPM: Limitations and Extensions of CAPM' },
      { num: 10, title: 'Portfolio Performance Appraisal Measures' },
      { num: 11, title: 'Applications of the CAPM in Portfolio Construction' },
    ],
  },
  {
    id: 85, subject: 'Port Mgmt', subjectFull: 'Portfolio Management',
    name: 'Portfolio Management: An Overview',
    lessons: [
      { num: 1, title: 'Portfolio Perspective: Diversification and Risk Reduction' },
      { num: 2, title: 'Portfolio Perspective: Risk-Return Trade-off, Downside Protection, Modern Portfolio Theory' },
      { num: 3, title: 'Steps in the Portfolio Management Process' },
      { num: 4, title: 'Types of Investors' },
      { num: 5, title: 'The Asset Management Industry' },
      { num: 6, title: 'Pooled Interest - Mutual Funds' },
      { num: 7, title: 'Pooled Interest - Type of Mutual Funds' },
      { num: 8, title: 'Pooled Interest - Other Investment Products' },
    ],
  },
  {
    id: 86, subject: 'Port Mgmt', subjectFull: 'Portfolio Management',
    name: 'Basics of Portfolio Planning and Construction',
    lessons: [
      { num: 1, title: 'The Investment Policy Statement' },
      { num: 2, title: 'IPS Risk and Return Objectives' },
      { num: 3, title: 'IPS Constraints' },
      { num: 4, title: 'Gathering Client Information' },
      { num: 5, title: 'Portfolio Construction and Capital Market Expectations' },
      { num: 6, title: 'Strategic Asset Allocation' },
      { num: 7, title: 'Portfolio Construction Principles' },
      { num: 8, title: 'ESG Considerations in Portfolio Planning and Construction' },
    ],
  },
  {
    id: 87, subject: 'Port Mgmt', subjectFull: 'Portfolio Management',
    name: 'The Behavioral Biases of Individuals',
    lessons: [
      { num: 1, title: 'Behavioral Bias Categories' },
      { num: 2, title: 'Cognitive Errors' },
      { num: 3, title: 'Emotional Biases' },
      { num: 4, title: 'Behavioral Finance and Market Behavior' },
    ],
  },
  {
    id: 88, subject: 'Port Mgmt', subjectFull: 'Portfolio Management',
    name: 'Introduction to Risk Management',
    lessons: [
      { num: 1, title: 'Risk Management Process' },
      { num: 2, title: 'Risk Management Framework' },
      { num: 3, title: 'Risk Governance - An Enterprise View' },
      { num: 4, title: 'Risk Tolerance' },
      { num: 5, title: 'Risk Budgeting' },
      { num: 6, title: 'Identification of Risk - Financial Vs. Non-Financial Risk' },
      { num: 7, title: 'Interactions Between Risks' },
      { num: 8, title: 'Measuring and Modifying Risk: Drivers and Metrics' },
      { num: 9, title: 'Risk Modification: Prevention, Avoidance, and Acceptance' },
      { num: 10, title: 'Risk Modification: Transferring, Shifting, and How to Choose' },
    ],
  },

  // ── Ethics (89-93) ───────────────────────────────────────────────────────
  {
    id: 89, subject: 'Ethics', subjectFull: 'Ethics',
    name: 'Ethics and Trust in the Investment Profession',
    lessons: [
      { num: 1, title: 'Ethics' },
      { num: 2, title: 'Ethics and Professionalism' },
      { num: 3, title: 'Challenges to Ethical Conduct' },
      { num: 4, title: 'Ethical vs. Legal Standards' },
      { num: 5, title: 'Ethical Decision-Making Frameworks' },
      { num: 6, title: 'Conclusion' },
    ],
  },
  {
    id: 90, subject: 'Ethics', subjectFull: 'Ethics',
    name: 'Code of Ethics and Standards of Professional Conduct',
    lessons: [
      { num: 1, title: 'Preface' },
      { num: 2, title: 'Ethics and the Investment Industry' },
      { num: 3, title: 'CFA Institute Code of Ethics and Standards of Professional Conduct' },
    ],
  },
  {
    id: 91, subject: 'Ethics', subjectFull: 'Ethics',
    name: 'Guidance for Standards I–VII',
    lessons: [
      { num: 1, title: 'Standard I: Professionalism' },
      { num: 2, title: 'Standard I(A): Recommended Procedures' },
      { num: 3, title: 'Standard I(A): Application of the Standard' },
      { num: 4, title: 'Standard I(B): Independence and Objectivity' },
      { num: 5, title: 'Standard I(B): Recommended Procedures' },
      { num: 6, title: 'Standard I(B): Application of the Standard' },
      { num: 7, title: 'Standard I(C): Misrepresentation' },
      { num: 8, title: 'Standard I(C): Recommended Procedures' },
      { num: 9, title: 'Standard I(C): Application of the Standard' },
      { num: 10, title: 'Standard I(D): Misconduct' },
      { num: 11, title: 'Standard I(D): Recommended Procedures' },
      { num: 12, title: 'Standard I(D): Application of the Standard' },
      { num: 13, title: 'Standard I(E): Competence' },
      { num: 14, title: 'Standard I(E): Recommended Procedures' },
      { num: 15, title: 'Standard I(E): Application of the Standard' },
      { num: 16, title: 'Standard II: Integrity of Capital Markets' },
      { num: 17, title: 'Standard II(A): Recommended Procedures' },
      { num: 18, title: 'Standard II(A): Application of the Standard' },
      { num: 19, title: 'Standard II(B): Market Manipulation' },
      { num: 20, title: 'Standard II(B): Application of the Standard' },
      { num: 21, title: 'Standard III: Duties to Clients' },
      { num: 22, title: 'Standard III(A): Recommended Procedures' },
      { num: 23, title: 'Standard III(A): Application of the Standard' },
      { num: 24, title: 'Standard III(B): Fair Dealing' },
      { num: 25, title: 'Standard III(B): Recommended Procedures' },
      { num: 26, title: 'Standard III(B): Application of the Standard' },
      { num: 27, title: 'Standard III(C): Suitability' },
      { num: 28, title: 'Standard III(C): Recommended Procedures' },
      { num: 29, title: 'Standard III(C): Application of the Standard' },
      { num: 30, title: 'Standard III(D): Performance Presentation' },
      { num: 31, title: 'Standard III(D): Recommended Procedures' },
      { num: 32, title: 'Standard III(D): Application of the Standard' },
      { num: 33, title: 'Standard III(E): Preservation of Confidentiality' },
      { num: 34, title: 'Standard III(E): Recommended Procedures' },
      { num: 35, title: 'Standard III(E): Application of the Standard' },
      { num: 36, title: 'Standard IV: Duties to Employers' },
      { num: 37, title: 'Standard IV(A): Recommended Procedures' },
      { num: 38, title: 'Standard IV(A): Application of the Standard' },
      { num: 39, title: 'Standard IV(B): Additional Compensation Arrangements' },
      { num: 40, title: 'Standard IV(B): Recommended Procedures' },
      { num: 41, title: 'Standard IV(B): Application of the Standard' },
      { num: 42, title: 'Standard IV(C): Responsibilities of Supervisors' },
      { num: 43, title: 'Standard IV(C): Recommended Procedures' },
      { num: 44, title: 'Standard IV(C): Application of the Standard' },
      { num: 45, title: 'Standard V: Investment Analysis, Recommendations, and Actions' },
      { num: 46, title: 'Standard V(A): Recommended Procedures' },
      { num: 47, title: 'Standard V(A): Application of the Standard' },
      { num: 48, title: 'Standard V(B): Communication with Clients and Prospective Clients' },
      { num: 49, title: 'Standard V(B): Recommended Procedures' },
      { num: 50, title: 'Standard V(B): Application of the Standard' },
      { num: 51, title: 'Standard V(C): Record Retention' },
      { num: 52, title: 'Standard V(C): Recommended Procedures' },
      { num: 53, title: 'Standard V(C): Application of the Standard' },
      { num: 54, title: 'Standard VI: Conflicts of Interest' },
      { num: 55, title: 'Standard VI(A): Application of the Standard' },
      { num: 56, title: 'Standard VI(B): Priority of Transactions' },
      { num: 57, title: 'Standard VI(B): Recommended Procedures' },
      { num: 58, title: 'Standard VI(B): Application of the Standard' },
      { num: 59, title: 'Standard VI(C): Referral Fees' },
      { num: 60, title: 'Standard VI(C): Recommended Procedures' },
      { num: 61, title: 'Standard VI(C): Application of the Standard' },
      { num: 62, title: 'Standard VII: Responsibilities as a CFA Institute Member or CFA Candidate' },
      { num: 63, title: 'Standard VII(A): Application of the Standard' },
      { num: 64, title: 'Standard VII(B): Reference to CFA Institute, the CFA Designation, and the CFA Program' },
      { num: 65, title: 'Standard VII(B): Recommended Procedures' },
      { num: 66, title: 'Standard VII(B): Application of the Standard' },
    ],
  },
  {
    id: 92, subject: 'Ethics', subjectFull: 'Ethics',
    name: 'Introduction to the Global Investment Performance Standards (GIPS)',
    lessons: [
      { num: 1, title: 'Why Were the GIPS Standards Created, Who Can Claim Compliance, & Who Benefits from Compliance?' },
      { num: 2, title: 'Composites' },
      { num: 3, title: 'Fundamentals of Compliance' },
      { num: 4, title: 'Verification' },
    ],
  },
  {
    id: 93, subject: 'Ethics', subjectFull: 'Ethics',
    name: 'Ethics Application',
    lessons: [
      { num: 1, title: 'Professionalism' },
      { num: 2, title: 'Integrity of Capital Markets' },
      { num: 3, title: 'Duties to Clients' },
      { num: 4, title: 'Duties to Employers' },
      { num: 5, title: 'Investment Analysis, Recommendations, and Actions' },
      { num: 6, title: 'Conflicts of Interest' },
      { num: 7, title: 'Responsibilities as a CFA Institute Member or CFA Candidate' },
    ],
  },
];

/** Returns all modules for a given subject full name */
export function getModulesForSubject(subjectFull) {
  return CFA_CURRICULUM.filter(m => m.subjectFull === subjectFull);
}

/** Returns total lesson count for a module */
export function lessonCount(module) {
  return module.lessons.length;
}

/** Returns a map of moduleId → module for quick lookup */
export const MODULE_BY_ID = Object.fromEntries(
  CFA_CURRICULUM.map(m => [m.id, m])
);