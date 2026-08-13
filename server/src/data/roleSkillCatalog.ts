import { additionalRoleSkillCatalog } from "./additionalRoleSkillCatalog.js";

export const roleSkillCatalog = [
  {
    "id": "DA-B-001",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Spreadsheets",
    "name": "Cell & number formatting",
    "tools": "Excel, Google Sheets",
    "description": "Apply currency/date/percent formats and conditional formatting to flag outliers."
  },
  {
    "id": "DA-B-002",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Spreadsheets",
    "name": "Core formulas",
    "tools": "Excel, Google Sheets",
    "description": "SUM, AVERAGE, COUNTIF, nested IF for basic calculated fields."
  },
  {
    "id": "DA-B-003",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Spreadsheets",
    "name": "Lookups",
    "tools": "Excel (VLOOKUP/INDEX-MATCH)",
    "description": "Join two tables on a key without manual matching."
  },
  {
    "id": "DA-B-004",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Spreadsheets",
    "name": "Pivot tables",
    "tools": "Excel, Google Sheets",
    "description": "Summarise raw rows by dimensions to get quick cuts."
  },
  {
    "id": "DA-B-005",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Data Prep",
    "name": "Basic data cleaning",
    "tools": "Excel Power Query",
    "description": "Trim, dedupe, split/merge columns, fix data types."
  },
  {
    "id": "DA-B-006",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "SQL",
    "name": "SELECT / WHERE / ORDER BY",
    "tools": "PostgreSQL, MySQL",
    "description": "Query a single table, filter rows, sort results."
  },
  {
    "id": "DA-B-007",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "SQL",
    "name": "Aggregations",
    "tools": "PostgreSQL",
    "description": "GROUP BY with COUNT/SUM/AVG and HAVING filters."
  },
  {
    "id": "DA-B-008",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "SQL",
    "name": "Joins",
    "tools": "PostgreSQL",
    "description": "INNER and LEFT joins across two related tables."
  },
  {
    "id": "DA-B-009",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Programming",
    "name": "Python fundamentals",
    "tools": "Python",
    "description": "Variables, loops, functions, lists and dicts."
  },
  {
    "id": "DA-B-010",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Tooling",
    "name": "Notebook environment setup",
    "tools": "Jupyter, VS Code, Anaconda",
    "description": "Run notebooks, manage kernels and a virtualenv."
  },
  {
    "id": "DA-B-011",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Version Control",
    "name": "Git basics",
    "tools": "Git, GitHub",
    "description": "Clone, commit, push, create a branch."
  },
  {
    "id": "DA-B-012",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Statistics",
    "name": "Descriptive statistics",
    "tools": "Excel, Python",
    "description": "Compute mean, median, std dev, quartiles."
  },
  {
    "id": "DA-B-013",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Visualization",
    "name": "Basic chart selection",
    "tools": "Excel, Google Sheets",
    "description": "Choose bar/line/pie/scatter appropriately."
  },
  {
    "id": "DA-B-014",
    "role": "Data Analyst",
    "level": "Basic",
    "category": "Data Literacy",
    "name": "Data type reasoning",
    "tools": "--",
    "description": "Distinguish categorical, numerical and temporal fields."
  },
  {
    "id": "DA-I-015",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Programming",
    "name": "pandas dataframes",
    "tools": "pandas",
    "description": "merge, groupby, pivot_table, apply for analysis."
  },
  {
    "id": "DA-I-016",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Programming",
    "name": "Vectorised computation",
    "tools": "numpy",
    "description": "Array operations and broadcasting for speed."
  },
  {
    "id": "DA-I-017",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Data Prep",
    "name": "Programmatic cleaning",
    "tools": "pandas",
    "description": "Handle nulls, coerce dtypes, treat outliers at scale."
  },
  {
    "id": "DA-I-018",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "SQL",
    "name": "Window functions",
    "tools": "PostgreSQL",
    "description": "ROW_NUMBER, RANK, LAG/LEAD, running totals."
  },
  {
    "id": "DA-I-019",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "SQL",
    "name": "CTEs & subqueries",
    "tools": "PostgreSQL",
    "description": "Structure complex logic with WITH clauses."
  },
  {
    "id": "DA-I-020",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "SQL",
    "name": "Query performance basics",
    "tools": "PostgreSQL",
    "description": "Read EXPLAIN plans and use indexes sensibly."
  },
  {
    "id": "DA-I-021",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Warehouse",
    "name": "Cloud warehouse querying",
    "tools": "BigQuery, Snowflake",
    "description": "Query large partitioned datasets efficiently."
  },
  {
    "id": "DA-I-022",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Transformation",
    "name": "dbt models & tests",
    "tools": "dbt",
    "description": "Build modular ref() models with schema tests."
  },
  {
    "id": "DA-I-023",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "BI",
    "name": "Dashboard building",
    "tools": "Power BI, Tableau",
    "description": "Build interactive dashboards with filters/slicers."
  },
  {
    "id": "DA-I-024",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "BI",
    "name": "Calculated measures",
    "tools": "Power BI (DAX), Tableau (LOD)",
    "description": "Write measures and level-of-detail expressions."
  },
  {
    "id": "DA-I-025",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "BI",
    "name": "Data modelling for BI",
    "tools": "Power BI",
    "description": "Star schema with fact/dimension relationships."
  },
  {
    "id": "DA-I-026",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Statistics",
    "name": "Hypothesis testing",
    "tools": "Python (scipy.stats)",
    "description": "t-test, chi-square, interpret p-values."
  },
  {
    "id": "DA-I-027",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Statistics",
    "name": "Regression analysis",
    "tools": "statsmodels",
    "description": "Fit linear regression and interpret coefficients."
  },
  {
    "id": "DA-I-028",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Analytics",
    "name": "A/B test analysis",
    "tools": "Python, SQL",
    "description": "Measure lift and statistical significance."
  },
  {
    "id": "DA-I-029",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Analytics",
    "name": "Cohort & retention analysis",
    "tools": "SQL, pandas",
    "description": "Build cohort tables and retention curves."
  },
  {
    "id": "DA-I-030",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Analytics",
    "name": "Funnel analysis",
    "tools": "SQL, Mixpanel, Amplitude",
    "description": "Quantify step-by-step conversion drop-off."
  },
  {
    "id": "DA-I-031",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "ETL",
    "name": "Scheduled pipelines",
    "tools": "Apache Airflow, cron",
    "description": "Automate recurring data refreshes."
  },
  {
    "id": "DA-I-032",
    "role": "Data Analyst",
    "level": "Intermediate",
    "category": "Reporting",
    "name": "Automated reporting",
    "tools": "Python, Google Sheets API",
    "description": "Schedule and deliver recurring reports."
  },
  {
    "id": "DA-A-033",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Architecture",
    "name": "Semantic / metrics layer",
    "tools": "dbt Semantic Layer, LookML",
    "description": "Define KPIs once as a single source of truth."
  },
  {
    "id": "DA-A-034",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Architecture",
    "name": "Dimensional modelling",
    "tools": "Kimball, dbt",
    "description": "SCD Type-2 and conformed dimensions at scale."
  },
  {
    "id": "DA-A-035",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Governance",
    "name": "Data quality frameworks",
    "tools": "Great Expectations, dbt tests",
    "description": "Automated validation and freshness checks."
  },
  {
    "id": "DA-A-036",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Optimization",
    "name": "Warehouse cost tuning",
    "tools": "BigQuery, Snowflake",
    "description": "Partition pruning, clustering, cost controls."
  },
  {
    "id": "DA-A-037",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Statistics",
    "name": "Time-series forecasting",
    "tools": "Prophet, statsmodels (ARIMA)",
    "description": "Forecast revenue/demand with confidence bands."
  },
  {
    "id": "DA-A-038",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Statistics",
    "name": "Causal inference",
    "tools": "DoWhy, diff-in-diff",
    "description": "Estimate treatment effect beyond correlation."
  },
  {
    "id": "DA-A-039",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Analytics",
    "name": "Predictive modelling",
    "tools": "scikit-learn",
    "description": "Churn/propensity scores that feed decisions."
  },
  {
    "id": "DA-A-040",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Stakeholder",
    "name": "Executive storytelling",
    "tools": "Tableau, PowerPoint",
    "description": "Turn analysis into a C-suite decision narrative."
  },
  {
    "id": "DA-A-041",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Enablement",
    "name": "Self-serve analytics",
    "tools": "Looker, Metabase",
    "description": "Build a governed self-serve layer for teams."
  },
  {
    "id": "DA-A-042",
    "role": "Data Analyst",
    "level": "Advanced",
    "category": "Strategy",
    "name": "North-star metric design",
    "tools": "--",
    "description": "Define and instrument the company KPI tree."
  },
  {
    "id": "ML-B-001",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Programming",
    "name": "Python for ML",
    "tools": "Python",
    "description": "Comprehensions, OOP, type hints for clean code."
  },
  {
    "id": "ML-B-002",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Programming",
    "name": "Numerical computing",
    "tools": "numpy",
    "description": "Arrays, broadcasting, dot products."
  },
  {
    "id": "ML-B-003",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Data",
    "name": "Data manipulation",
    "tools": "pandas",
    "description": "Load, clean and assemble feature tables."
  },
  {
    "id": "ML-B-004",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Math",
    "name": "Linear algebra",
    "tools": "numpy",
    "description": "Vectors, matrices, matrix multiplication."
  },
  {
    "id": "ML-B-005",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Math",
    "name": "Calculus intuition",
    "tools": "--",
    "description": "Derivatives and gradients as optimisation basis."
  },
  {
    "id": "ML-B-006",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Math",
    "name": "Probability basics",
    "tools": "--",
    "description": "Distributions and Bayes rule."
  },
  {
    "id": "ML-B-007",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Environment",
    "name": "Dependency management",
    "tools": "conda, pip, venv",
    "description": "Build reproducible environments."
  },
  {
    "id": "ML-B-008",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Version Control",
    "name": "Git for ML",
    "tools": "Git, GitHub",
    "description": "Branch, commit and open pull requests."
  },
  {
    "id": "ML-B-009",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "ML",
    "name": "Supervised learning basics",
    "tools": "scikit-learn",
    "description": "train/test split, fit and predict."
  },
  {
    "id": "ML-B-010",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "ML",
    "name": "Model evaluation basics",
    "tools": "scikit-learn",
    "description": "Accuracy, precision, recall, F1."
  },
  {
    "id": "ML-B-011",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Visualization",
    "name": "EDA plotting",
    "tools": "matplotlib, seaborn",
    "description": "Distributions and correlations before modelling."
  },
  {
    "id": "ML-B-012",
    "role": "AI/ML Developer",
    "level": "Basic",
    "category": "Prototyping",
    "name": "Notebook experimentation",
    "tools": "Jupyter, Google Colab",
    "description": "Iterate quickly on model ideas."
  },
  {
    "id": "ML-I-013",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "ML",
    "name": "Feature engineering",
    "tools": "scikit-learn, pandas",
    "description": "Encoding, scaling and interaction features."
  },
  {
    "id": "ML-I-014",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "ML",
    "name": "Ensemble models",
    "tools": "XGBoost, LightGBM, Random Forest",
    "description": "Train and tune gradient-boosted trees."
  },
  {
    "id": "ML-I-015",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "ML",
    "name": "Cross-validation",
    "tools": "scikit-learn",
    "description": "k-fold/stratified CV avoiding leakage."
  },
  {
    "id": "ML-I-016",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "ML",
    "name": "Hyperparameter tuning",
    "tools": "Optuna, GridSearchCV",
    "description": "Systematic search over parameter space."
  },
  {
    "id": "ML-I-017",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "ML",
    "name": "Imbalanced data handling",
    "tools": "imbalanced-learn (SMOTE)",
    "description": "Resampling and class weights."
  },
  {
    "id": "ML-I-018",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Deep Learning",
    "name": "Neural networks",
    "tools": "PyTorch, TensorFlow",
    "description": "Build and train MLPs and CNNs."
  },
  {
    "id": "ML-I-019",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Deep Learning",
    "name": "Custom training loops",
    "tools": "PyTorch",
    "description": "Optimisers, loss, backprop, schedulers."
  },
  {
    "id": "ML-I-020",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Deep Learning",
    "name": "Transfer learning",
    "tools": "HuggingFace, torchvision",
    "description": "Fine-tune pretrained backbones."
  },
  {
    "id": "ML-I-021",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "NLP",
    "name": "Transformer usage",
    "tools": "HuggingFace Transformers",
    "description": "Tokenizers, pipelines, fine-tuning."
  },
  {
    "id": "ML-I-022",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "LLM",
    "name": "Prompt engineering",
    "tools": "OpenAI / Anthropic API",
    "description": "Few-shot prompts and structured outputs."
  },
  {
    "id": "ML-I-023",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "LLM",
    "name": "RAG pipelines",
    "tools": "LangChain, LlamaIndex",
    "description": "Chunking, embeddings and retrieval."
  },
  {
    "id": "ML-I-024",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "LLM",
    "name": "Vector databases",
    "tools": "pgvector, Pinecone, Qdrant",
    "description": "Store and query embeddings for retrieval."
  },
  {
    "id": "ML-I-025",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Experimentation",
    "name": "Experiment tracking",
    "tools": "MLflow, Weights & Biases",
    "description": "Log params, metrics and artifacts."
  },
  {
    "id": "ML-I-026",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Serving",
    "name": "Model serving API",
    "tools": "FastAPI, Flask",
    "description": "Wrap a model behind a REST endpoint."
  },
  {
    "id": "ML-I-027",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Data",
    "name": "Data & model versioning",
    "tools": "DVC",
    "description": "Version datasets and model artifacts."
  },
  {
    "id": "ML-I-028",
    "role": "AI/ML Developer",
    "level": "Intermediate",
    "category": "Evaluation",
    "name": "Advanced metrics",
    "tools": "scikit-learn (ROC/AUC)",
    "description": "PR curves and probability calibration."
  },
  {
    "id": "ML-A-029",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "MLOps",
    "name": "Containerization",
    "tools": "Docker",
    "description": "Package model plus dependencies portably."
  },
  {
    "id": "ML-A-030",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "MLOps",
    "name": "Orchestration at scale",
    "tools": "Kubernetes, Kubeflow",
    "description": "Scale training and serving workloads."
  },
  {
    "id": "ML-A-031",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "MLOps",
    "name": "CI/CD for ML",
    "tools": "GitHub Actions, MLflow",
    "description": "Automate retrain, test and deploy."
  },
  {
    "id": "ML-A-032",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "MLOps",
    "name": "Feature stores",
    "tools": "Feast",
    "description": "Consistent features across train and serve."
  },
  {
    "id": "ML-A-033",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "MLOps",
    "name": "Model monitoring",
    "tools": "Evidently, Arize",
    "description": "Detect drift and performance decay in prod."
  },
  {
    "id": "ML-A-034",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "LLM",
    "name": "Parameter-efficient fine-tuning",
    "tools": "LoRA, PEFT, HuggingFace",
    "description": "Fine-tune large models cheaply."
  },
  {
    "id": "ML-A-035",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "LLM",
    "name": "Inference optimization",
    "tools": "vLLM, TensorRT, quantization",
    "description": "Cut latency and serving cost."
  },
  {
    "id": "ML-A-036",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "LLM",
    "name": "Agentic systems",
    "tools": "LangGraph, function calling",
    "description": "Multi-step tool-using agents."
  },
  {
    "id": "ML-A-037",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Deep Learning",
    "name": "Distributed training",
    "tools": "PyTorch DDP, Ray, DeepSpeed",
    "description": "Multi-GPU / multi-node training."
  },
  {
    "id": "ML-A-038",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Architecture",
    "name": "ML system design",
    "tools": "--",
    "description": "Balance latency, cost and accuracy at scale."
  },
  {
    "id": "ML-A-039",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Architecture",
    "name": "Scalable data pipelines",
    "tools": "Spark, Ray, Airflow",
    "description": "Large-scale feature and training pipelines."
  },
  {
    "id": "ML-A-040",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Cloud",
    "name": "Managed ML platforms",
    "tools": "AWS SageMaker, Vertex AI",
    "description": "Run managed training and deployment."
  },
  {
    "id": "ML-A-041",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Governance",
    "name": "Responsible AI",
    "tools": "Fairlearn, SHAP, model cards",
    "description": "Bias audits and explainability."
  },
  {
    "id": "ML-A-042",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Governance",
    "name": "Model governance",
    "tools": "Model registry, lineage",
    "description": "Approval, versioning and audit trail."
  },
  {
    "id": "ML-A-043",
    "role": "AI/ML Developer",
    "level": "Advanced",
    "category": "Strategy",
    "name": "ML roadmap & build-vs-buy",
    "tools": "--",
    "description": "Align ML investment to business outcomes."
  },
  {
    "id": "AE-B-001",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Product",
    "name": "Product knowledge",
    "tools": "--",
    "description": "Explain features, use cases and value props."
  },
  {
    "id": "AE-B-002",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Product",
    "name": "ICP & personas",
    "tools": "--",
    "description": "Identify ideal customer profile and buyer personas."
  },
  {
    "id": "AE-B-003",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "CRM",
    "name": "CRM data hygiene",
    "tools": "HubSpot, Salesforce",
    "description": "Log activities and keep stages current."
  },
  {
    "id": "AE-B-004",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Outreach",
    "name": "Cold email fundamentals",
    "tools": "Gmail, Outlook",
    "description": "Personalise opener and subject line."
  },
  {
    "id": "AE-B-005",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Outreach",
    "name": "Cold calling fundamentals",
    "tools": "Aircall, phone",
    "description": "Openers and gatekeeper navigation."
  },
  {
    "id": "AE-B-006",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Discovery",
    "name": "Basic discovery questions",
    "tools": "--",
    "description": "Surface pain, budget and timeline."
  },
  {
    "id": "AE-B-007",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Pipeline",
    "name": "Pipeline stage literacy",
    "tools": "CRM",
    "description": "Understand MQL/SQL/opportunity definitions."
  },
  {
    "id": "AE-B-008",
    "role": "SaaS Sales (AE)",
    "level": "Basic",
    "category": "Demo",
    "name": "Core product demo",
    "tools": "Zoom, product",
    "description": "Walk a prospect through core features."
  },
  {
    "id": "AE-I-009",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Methodology",
    "name": "Qualification frameworks",
    "tools": "MEDDIC, SPIN, BANT",
    "description": "Qualify deals systematically."
  },
  {
    "id": "AE-I-010",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Discovery",
    "name": "Value-based discovery",
    "tools": "--",
    "description": "Map pain to quantified business impact."
  },
  {
    "id": "AE-I-011",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Demo",
    "name": "Tailored demos",
    "tools": "Zoom, Loom",
    "description": "Demo to discovered pain, not a feature dump."
  },
  {
    "id": "AE-I-012",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Objections",
    "name": "Objection handling",
    "tools": "--",
    "description": "Address price, competitor and timing objections."
  },
  {
    "id": "AE-I-013",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Negotiation",
    "name": "Deal negotiation",
    "tools": "--",
    "description": "Hold discount guardrails and structure terms."
  },
  {
    "id": "AE-I-014",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Forecasting",
    "name": "Pipeline forecasting",
    "tools": "Salesforce, Clari",
    "description": "Categorise commit vs best-case."
  },
  {
    "id": "AE-I-015",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Stakeholders",
    "name": "Multi-threaded selling",
    "tools": "--",
    "description": "Engage champion, economic buyer and blocker."
  },
  {
    "id": "AE-I-016",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Tooling",
    "name": "Sales engagement",
    "tools": "Outreach, Salesloft",
    "description": "Run sequences and cadences."
  },
  {
    "id": "AE-I-017",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Tooling",
    "name": "Conversation intelligence",
    "tools": "Gong, Chorus",
    "description": "Review calls and coach from data."
  },
  {
    "id": "AE-I-018",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Proposals",
    "name": "Quoting & e-signature",
    "tools": "PandaDoc, DocuSign, CPQ",
    "description": "Build, send and close paperwork."
  },
  {
    "id": "AE-I-019",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Metrics",
    "name": "SaaS sales metrics",
    "tools": "--",
    "description": "Track ACV, win rate and sales-cycle length."
  },
  {
    "id": "AE-I-020",
    "role": "SaaS Sales (AE)",
    "level": "Intermediate",
    "category": "Expansion",
    "name": "Upsell & cross-sell",
    "tools": "CRM",
    "description": "Grow revenue within existing accounts."
  },
  {
    "id": "AE-A-021",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Complex/enterprise deals",
    "tools": "MEDDPICC",
    "description": "Manage multi-quarter, procurement-heavy deals."
  },
  {
    "id": "AE-A-022",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Land-and-expand",
    "tools": "--",
    "description": "Sequence entry then account expansion."
  },
  {
    "id": "AE-A-023",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Territory & account planning",
    "tools": "--",
    "description": "Segment TAM and prioritise targets."
  },
  {
    "id": "AE-A-024",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Negotiation",
    "name": "Enterprise negotiation",
    "tools": "--",
    "description": "Navigate MSAs, security reviews, multi-year."
  },
  {
    "id": "AE-A-025",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Forecasting",
    "name": "Forecast governance",
    "tools": "Clari, Salesforce",
    "description": "Risk-score and roll up team forecast."
  },
  {
    "id": "AE-A-026",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Pricing",
    "name": "Pricing & packaging strategy",
    "tools": "--",
    "description": "Design tiers, usage pricing and discount policy."
  },
  {
    "id": "AE-A-027",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Economics",
    "name": "Unit-economics alignment",
    "tools": "--",
    "description": "Tie deals to LTV:CAC and payback narrative."
  },
  {
    "id": "AE-A-028",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Ecosystem",
    "name": "Partner/channel selling",
    "tools": "PRM",
    "description": "Co-sell and source through partners."
  },
  {
    "id": "AE-A-029",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "Leadership",
    "name": "Deal review coaching",
    "tools": "--",
    "description": "Run MEDDPICC deal reviews for reps."
  },
  {
    "id": "AE-A-030",
    "role": "SaaS Sales (AE)",
    "level": "Advanced",
    "category": "C-Suite",
    "name": "Executive selling",
    "tools": "--",
    "description": "Build and defend the CxO business case."
  },
  {
    "id": "FS-B-001",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Territory",
    "name": "Beat / route planning",
    "tools": "Google Maps, CRM",
    "description": "Plan daily coverage of a territory."
  },
  {
    "id": "FS-B-002",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Product",
    "name": "On-ground product pitch",
    "tools": "--",
    "description": "Deliver a concise in-person value pitch."
  },
  {
    "id": "FS-B-003",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Prospecting",
    "name": "Cold walk-ins",
    "tools": "--",
    "description": "Approach shops and offices unannounced."
  },
  {
    "id": "FS-B-004",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "CRM",
    "name": "Mobile CRM logging",
    "tools": "Zoho, LeadSquared, SF Mobile",
    "description": "Log visits and outcomes on the go."
  },
  {
    "id": "FS-B-005",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Communication",
    "name": "Local-language rapport",
    "tools": "--",
    "description": "Build trust in Hindi / regional language."
  },
  {
    "id": "FS-B-006",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Communication",
    "name": "Rapport building",
    "tools": "--",
    "description": "Use local context and small talk to open doors."
  },
  {
    "id": "FS-B-007",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Quoting",
    "name": "On-spot price quoting",
    "tools": "--",
    "description": "Present price sheets and quick quotes."
  },
  {
    "id": "FS-B-008",
    "role": "Field Sales Executive",
    "level": "Basic",
    "category": "Onboarding",
    "name": "KYC / signup docs",
    "tools": "--",
    "description": "Collect documents needed to onboard."
  },
  {
    "id": "FS-I-009",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Territory",
    "name": "Beat optimization",
    "tools": "LeadSquared, mapping",
    "description": "Route by lead density and visit frequency."
  },
  {
    "id": "FS-I-010",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Discovery",
    "name": "On-ground needs discovery",
    "tools": "--",
    "description": "Diagnose MSME pain points face to face."
  },
  {
    "id": "FS-I-011",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Demo",
    "name": "Live product demo",
    "tools": "Mobile / laptop",
    "description": "Show the product working in real time."
  },
  {
    "id": "FS-I-012",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Objections",
    "name": "Field objection handling",
    "tools": "--",
    "description": "Handle trust, price and 'will it work for me'."
  },
  {
    "id": "FS-I-013",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Closing",
    "name": "On-spot closing",
    "tools": "UPI, payment links",
    "description": "Close and collect payment in the same visit."
  },
  {
    "id": "FS-I-014",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Relationships",
    "name": "Dealer/retailer relationships",
    "tools": "--",
    "description": "Build repeat trust through regular visits."
  },
  {
    "id": "FS-I-015",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Reporting",
    "name": "Daily activity reporting",
    "tools": "CRM, WhatsApp",
    "description": "File DSR with geo check-ins."
  },
  {
    "id": "FS-I-016",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Referrals",
    "name": "Referral generation",
    "tools": "--",
    "description": "Ask satisfied customers for introductions."
  },
  {
    "id": "FS-I-017",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Collections",
    "name": "Renewal & dues follow-up",
    "tools": "--",
    "description": "Chase renewals and pending payments."
  },
  {
    "id": "FS-I-018",
    "role": "Field Sales Executive",
    "level": "Intermediate",
    "category": "Tooling",
    "name": "Geo-attendance apps",
    "tools": "LeadSquared, field apps",
    "description": "Check in/out with location tracking."
  },
  {
    "id": "FS-A-019",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Territory expansion",
    "tools": "--",
    "description": "Plan and launch new beats/markets."
  },
  {
    "id": "FS-A-020",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Channel",
    "name": "Distributor onboarding",
    "tools": "--",
    "description": "Recruit and enable local resellers."
  },
  {
    "id": "FS-A-021",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Channel",
    "name": "Trade-scheme communication",
    "tools": "--",
    "description": "Explain incentive schemes to channel."
  },
  {
    "id": "FS-A-022",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Team",
    "name": "Field team coordination",
    "tools": "CRM, dashboards",
    "description": "Coordinate and mentor junior reps."
  },
  {
    "id": "FS-A-023",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Analytics",
    "name": "Territory analytics",
    "tools": "CRM dashboards",
    "description": "Conversion and productivity by beat."
  },
  {
    "id": "FS-A-024",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Activation",
    "name": "Local market activations",
    "tools": "--",
    "description": "Run camps/melas for scaled demos."
  },
  {
    "id": "FS-A-025",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Governance",
    "name": "Field SOP design",
    "tools": "--",
    "description": "Standardise the visit-to-close workflow."
  },
  {
    "id": "FS-A-026",
    "role": "Field Sales Executive",
    "level": "Advanced",
    "category": "Forecasting",
    "name": "Territory forecasting",
    "tools": "CRM",
    "description": "Predict territory revenue reliably."
  },
  {
    "id": "BDE-B-001",
    "role": "BDE",
    "level": "Basic",
    "category": "Research",
    "name": "Company research",
    "tools": "LinkedIn, Google",
    "description": "Identify target companies fitting the ICP."
  },
  {
    "id": "BDE-B-002",
    "role": "BDE",
    "level": "Basic",
    "category": "Research",
    "name": "Contact finding",
    "tools": "Apollo, Lusha, Hunter",
    "description": "Source emails and phone numbers."
  },
  {
    "id": "BDE-B-003",
    "role": "BDE",
    "level": "Basic",
    "category": "Outreach",
    "name": "Email outreach",
    "tools": "Gmail, Instantly",
    "description": "Send introductory outbound emails."
  },
  {
    "id": "BDE-B-004",
    "role": "BDE",
    "level": "Basic",
    "category": "Outreach",
    "name": "LinkedIn outreach",
    "tools": "LinkedIn, Sales Navigator",
    "description": "Connect and send opening messages."
  },
  {
    "id": "BDE-B-005",
    "role": "BDE",
    "level": "Basic",
    "category": "CRM",
    "name": "Lead logging",
    "tools": "HubSpot, Zoho",
    "description": "Track leads and statuses."
  },
  {
    "id": "BDE-B-006",
    "role": "BDE",
    "level": "Basic",
    "category": "Outreach",
    "name": "Cold calling",
    "tools": "Phone",
    "description": "Deliver an intro pitch by phone."
  },
  {
    "id": "BDE-B-007",
    "role": "BDE",
    "level": "Basic",
    "category": "Qualification",
    "name": "Basic qualification",
    "tools": "BANT",
    "description": "Check budget, authority, need, timeline."
  },
  {
    "id": "BDE-I-008",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Prospecting",
    "name": "Targeted list building",
    "tools": "Apollo, Sales Navigator",
    "description": "Build ICP-filtered prospect lists."
  },
  {
    "id": "BDE-I-009",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Prospecting",
    "name": "Multichannel sequences",
    "tools": "Instantly, Lemlist, Outreach",
    "description": "Blend email, LinkedIn and calls."
  },
  {
    "id": "BDE-I-010",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Copywriting",
    "name": "Personalised messaging",
    "tools": "--",
    "description": "Write relevance-driven outreach copy."
  },
  {
    "id": "BDE-I-011",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Discovery",
    "name": "Discovery calls",
    "tools": "Zoom",
    "description": "Uncover pain and qualify fit."
  },
  {
    "id": "BDE-I-012",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Meetings",
    "name": "Meeting setting",
    "tools": "Calendly",
    "description": "Book qualified meetings for AEs."
  },
  {
    "id": "BDE-I-013",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Handoff",
    "name": "AE handoff",
    "tools": "CRM",
    "description": "Transfer clean context to closers."
  },
  {
    "id": "BDE-I-014",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Metrics",
    "name": "Activity metrics",
    "tools": "CRM dashboards",
    "description": "Track reply and meeting-booked rates."
  },
  {
    "id": "BDE-I-015",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Nurture",
    "name": "Lead nurturing",
    "tools": "HubSpot sequences",
    "description": "Re-engage cold or stalled leads."
  },
  {
    "id": "BDE-I-016",
    "role": "BDE",
    "level": "Intermediate",
    "category": "Data",
    "name": "Data enrichment",
    "tools": "Clearbit, Apollo",
    "description": "Enrich records for better targeting."
  },
  {
    "id": "BDE-A-017",
    "role": "BDE",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Outbound strategy design",
    "tools": "--",
    "description": "Design channel mix and ICP experiments."
  },
  {
    "id": "BDE-A-018",
    "role": "BDE",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Account-based marketing",
    "tools": "6sense, HubSpot",
    "description": "Run coordinated target-account plays."
  },
  {
    "id": "BDE-A-019",
    "role": "BDE",
    "level": "Advanced",
    "category": "Automation",
    "name": "Outbound automation",
    "tools": "Clay, Apollo, n8n",
    "description": "Scale personalised outbound."
  },
  {
    "id": "BDE-A-020",
    "role": "BDE",
    "level": "Advanced",
    "category": "Analytics",
    "name": "Funnel analytics",
    "tools": "CRM",
    "description": "Optimise conversion by stage."
  },
  {
    "id": "BDE-A-021",
    "role": "BDE",
    "level": "Advanced",
    "category": "Deliverability",
    "name": "Email deliverability",
    "tools": "Warm-up tools, SPF/DKIM",
    "description": "Protect inbox placement at volume."
  },
  {
    "id": "BDE-A-022",
    "role": "BDE",
    "level": "Advanced",
    "category": "Experimentation",
    "name": "Messaging A/B testing",
    "tools": "Instantly, Lemlist",
    "description": "Test copy and subject lines."
  },
  {
    "id": "BDE-A-023",
    "role": "BDE",
    "level": "Advanced",
    "category": "Enablement",
    "name": "Playbook creation",
    "tools": "Notion",
    "description": "Document repeatable BD process."
  },
  {
    "id": "BDE-A-024",
    "role": "BDE",
    "level": "Advanced",
    "category": "Market",
    "name": "Segment expansion",
    "tools": "--",
    "description": "Enter new verticals systematically."
  },
  {
    "id": "BDM-B-001",
    "role": "BDM",
    "level": "Basic",
    "category": "Pipeline",
    "name": "Pipeline oversight",
    "tools": "CRM",
    "description": "Monitor the team's pipeline health."
  },
  {
    "id": "BDM-B-002",
    "role": "BDM",
    "level": "Basic",
    "category": "Product",
    "name": "Solution knowledge",
    "tools": "--",
    "description": "Know the product and its market fit deeply."
  },
  {
    "id": "BDM-B-003",
    "role": "BDM",
    "level": "Basic",
    "category": "Communication",
    "name": "Stakeholder communication",
    "tools": "Email, Slack",
    "description": "Communicate clearly internally and externally."
  },
  {
    "id": "BDM-B-004",
    "role": "BDM",
    "level": "Basic",
    "category": "Reporting",
    "name": "Basic reporting",
    "tools": "Excel, CRM",
    "description": "Produce weekly performance numbers."
  },
  {
    "id": "BDM-B-005",
    "role": "BDM",
    "level": "Basic",
    "category": "Deals",
    "name": "Deal support",
    "tools": "CRM",
    "description": "Assist reps on live opportunities."
  },
  {
    "id": "BDM-I-006",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Partnerships",
    "name": "Partnership development",
    "tools": "--",
    "description": "Identify and open partner relationships."
  },
  {
    "id": "BDM-I-007",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Deals",
    "name": "Deal structuring",
    "tools": "--",
    "description": "Shape scope, pricing and terms."
  },
  {
    "id": "BDM-I-008",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Negotiation",
    "name": "Contract negotiation",
    "tools": "DocuSign",
    "description": "Negotiate commercial terms to close."
  },
  {
    "id": "BDM-I-009",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Team",
    "name": "Team coordination",
    "tools": "CRM",
    "description": "Assign leads and coordinate effort."
  },
  {
    "id": "BDM-I-010",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Forecasting",
    "name": "Revenue forecasting",
    "tools": "Salesforce, Clari",
    "description": "Roll up a defensible team forecast."
  },
  {
    "id": "BDM-I-011",
    "role": "BDM",
    "level": "Intermediate",
    "category": "GTM",
    "name": "GTM execution",
    "tools": "--",
    "description": "Execute go-to-market plays on the ground."
  },
  {
    "id": "BDM-I-012",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Metrics",
    "name": "Pipeline metrics",
    "tools": "CRM dashboards",
    "description": "Track coverage, velocity, conversion."
  },
  {
    "id": "BDM-I-013",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Alignment",
    "name": "Cross-functional alignment",
    "tools": "--",
    "description": "Sync with product and marketing."
  },
  {
    "id": "BDM-I-014",
    "role": "BDM",
    "level": "Intermediate",
    "category": "Proposals",
    "name": "RFP / proposal management",
    "tools": "--",
    "description": "Coordinate strong RFP responses."
  },
  {
    "id": "BDM-A-015",
    "role": "BDM",
    "level": "Advanced",
    "category": "Strategy",
    "name": "GTM strategy design",
    "tools": "--",
    "description": "Set segment, channel and pricing strategy."
  },
  {
    "id": "BDM-A-016",
    "role": "BDM",
    "level": "Advanced",
    "category": "Strategy",
    "name": "New-market entry",
    "tools": "--",
    "description": "Plan geographic/vertical expansion."
  },
  {
    "id": "BDM-A-017",
    "role": "BDM",
    "level": "Advanced",
    "category": "Partnerships",
    "name": "Strategic alliances",
    "tools": "PRM",
    "description": "Build co-sell and ecosystem partnerships."
  },
  {
    "id": "BDM-A-018",
    "role": "BDM",
    "level": "Advanced",
    "category": "Leadership",
    "name": "Hiring & coaching",
    "tools": "--",
    "description": "Build and mentor the BD team."
  },
  {
    "id": "BDM-A-019",
    "role": "BDM",
    "level": "Advanced",
    "category": "Leadership",
    "name": "Quota & comp design",
    "tools": "--",
    "description": "Set quotas and incentive plans."
  },
  {
    "id": "BDM-A-020",
    "role": "BDM",
    "level": "Advanced",
    "category": "Finance",
    "name": "Unit economics ownership",
    "tools": "--",
    "description": "Own margin, CAC and LTV levers."
  },
  {
    "id": "BDM-A-021",
    "role": "BDM",
    "level": "Advanced",
    "category": "Negotiation",
    "name": "Complex negotiation",
    "tools": "--",
    "description": "Handle multi-party, multi-year deals."
  },
  {
    "id": "BDM-A-022",
    "role": "BDM",
    "level": "Advanced",
    "category": "Governance",
    "name": "Sales-process governance",
    "tools": "CRM, RevOps",
    "description": "Enforce stage definitions and hygiene."
  },
  {
    "id": "BDM-A-023",
    "role": "BDM",
    "level": "Advanced",
    "category": "C-Suite",
    "name": "Board/investor reporting",
    "tools": "--",
    "description": "Present the growth narrative to leadership."
  },
  {
    "id": "BDM-A-024",
    "role": "BDM",
    "level": "Advanced",
    "category": "Analytics",
    "name": "Revenue analytics",
    "tools": "BI tools",
    "description": "Analyse retention and expansion cohorts."
  },
  {
    "id": "SDR-B-001",
    "role": "SDR",
    "level": "Basic",
    "category": "Research",
    "name": "Account research",
    "tools": "LinkedIn, Google",
    "description": "Understand target accounts before outreach."
  },
  {
    "id": "SDR-B-002",
    "role": "SDR",
    "level": "Basic",
    "category": "Data",
    "name": "Contact sourcing",
    "tools": "Apollo, ZoomInfo, Lusha",
    "description": "Find the right decision-makers."
  },
  {
    "id": "SDR-B-003",
    "role": "SDR",
    "level": "Basic",
    "category": "Outreach",
    "name": "Email sequencing basics",
    "tools": "Outreach, Salesloft",
    "description": "Enrol prospects into sequences."
  },
  {
    "id": "SDR-B-004",
    "role": "SDR",
    "level": "Basic",
    "category": "Outreach",
    "name": "Cold call basics",
    "tools": "Aircall, phone",
    "description": "Deliver a crisp opener and pitch."
  },
  {
    "id": "SDR-B-005",
    "role": "SDR",
    "level": "Basic",
    "category": "CRM",
    "name": "CRM logging",
    "tools": "Salesforce, HubSpot",
    "description": "Log activity and dispositions."
  },
  {
    "id": "SDR-B-006",
    "role": "SDR",
    "level": "Basic",
    "category": "Qualification",
    "name": "Lead qualification",
    "tools": "BANT",
    "description": "Apply a basic qualification check."
  },
  {
    "id": "SDR-B-007",
    "role": "SDR",
    "level": "Basic",
    "category": "Objections",
    "name": "Brush-off handling",
    "tools": "--",
    "description": "Respond to early 'not interested' replies."
  },
  {
    "id": "SDR-I-008",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Prospecting",
    "name": "ICP list building",
    "tools": "Sales Navigator, Apollo",
    "description": "Build tightly targeted prospect lists."
  },
  {
    "id": "SDR-I-009",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Sequences",
    "name": "Cadence building",
    "tools": "Outreach, Salesloft",
    "description": "Design multi-touch cadences."
  },
  {
    "id": "SDR-I-010",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Copywriting",
    "name": "Personalisation at scale",
    "tools": "--",
    "description": "Trigger-based personalisation across volume."
  },
  {
    "id": "SDR-I-011",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Calling",
    "name": "Advanced cold calling",
    "tools": "Gong, phone",
    "description": "Handle objections live with tonality."
  },
  {
    "id": "SDR-I-012",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Social",
    "name": "Social selling",
    "tools": "LinkedIn",
    "description": "Warm accounts through engagement."
  },
  {
    "id": "SDR-I-013",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Meetings",
    "name": "Meeting booking",
    "tools": "Calendly, Chili Piper",
    "description": "Book and confirm qualified meetings."
  },
  {
    "id": "SDR-I-014",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Metrics",
    "name": "Activity KPIs",
    "tools": "CRM dashboards",
    "description": "Track dials, replies and meetings."
  },
  {
    "id": "SDR-I-015",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Handoff",
    "name": "SQL handoff",
    "tools": "CRM",
    "description": "Pass qualified context to the AE."
  },
  {
    "id": "SDR-I-016",
    "role": "SDR",
    "level": "Intermediate",
    "category": "Nurture",
    "name": "Persistent follow-up",
    "tools": "Outreach",
    "description": "Run disciplined multi-touch follow-up."
  },
  {
    "id": "SDR-A-017",
    "role": "SDR",
    "level": "Advanced",
    "category": "Optimization",
    "name": "Sequence optimization",
    "tools": "Gong, Outreach",
    "description": "Tune cadences from performance data."
  },
  {
    "id": "SDR-A-018",
    "role": "SDR",
    "level": "Advanced",
    "category": "Automation",
    "name": "Prospecting automation",
    "tools": "Clay, Apollo",
    "description": "Automate enrichment and outreach."
  },
  {
    "id": "SDR-A-019",
    "role": "SDR",
    "level": "Advanced",
    "category": "Deliverability",
    "name": "Email deliverability",
    "tools": "Warm-up, DNS records",
    "description": "Sustain inbox placement at scale."
  },
  {
    "id": "SDR-A-020",
    "role": "SDR",
    "level": "Advanced",
    "category": "Experimentation",
    "name": "A/B messaging tests",
    "tools": "Outreach, Lemlist",
    "description": "Optimise copy through testing."
  },
  {
    "id": "SDR-A-021",
    "role": "SDR",
    "level": "Advanced",
    "category": "Intent",
    "name": "Intent-data plays",
    "tools": "6sense, Bombora",
    "description": "Prioritise in-market accounts."
  },
  {
    "id": "SDR-A-022",
    "role": "SDR",
    "level": "Advanced",
    "category": "Enablement",
    "name": "Playbook contribution",
    "tools": "Notion",
    "description": "Codify winning plays for the team."
  },
  {
    "id": "SDR-A-023",
    "role": "SDR",
    "level": "Advanced",
    "category": "Coaching",
    "name": "Peer call coaching",
    "tools": "Gong",
    "description": "Share best-practice call reviews."
  },
  {
    "id": "SDR-A-024",
    "role": "SDR",
    "level": "Advanced",
    "category": "Analytics",
    "name": "Conversion analytics",
    "tools": "CRM",
    "description": "Optimise stage-level conversion."
  },
  {
    "id": "EA-B-001",
    "role": "EA",
    "level": "Basic",
    "category": "Calendar",
    "name": "Calendar management",
    "tools": "Google Calendar, Outlook",
    "description": "Schedule meetings and send invites."
  },
  {
    "id": "EA-B-002",
    "role": "EA",
    "level": "Basic",
    "category": "Email",
    "name": "Inbox management",
    "tools": "Gmail, Outlook",
    "description": "Triage, flag and respond on time."
  },
  {
    "id": "EA-B-003",
    "role": "EA",
    "level": "Basic",
    "category": "Communication",
    "name": "Professional email writing",
    "tools": "--",
    "description": "Draft clear, courteous correspondence."
  },
  {
    "id": "EA-B-004",
    "role": "EA",
    "level": "Basic",
    "category": "Documents",
    "name": "Document formatting",
    "tools": "Google Docs, Word",
    "description": "Format memos and letters cleanly."
  },
  {
    "id": "EA-B-005",
    "role": "EA",
    "level": "Basic",
    "category": "Travel",
    "name": "Basic travel booking",
    "tools": "MakeMyTrip, booking sites",
    "description": "Book flights and hotels."
  },
  {
    "id": "EA-B-006",
    "role": "EA",
    "level": "Basic",
    "category": "Tasks",
    "name": "Task tracking",
    "tools": "Notion, Todoist, Trello",
    "description": "Maintain and prioritise to-dos."
  },
  {
    "id": "EA-B-007",
    "role": "EA",
    "level": "Basic",
    "category": "Meetings",
    "name": "Meeting scheduling",
    "tools": "Calendly",
    "description": "Coordinate mutually free slots."
  },
  {
    "id": "EA-B-008",
    "role": "EA",
    "level": "Basic",
    "category": "Files",
    "name": "File organisation",
    "tools": "Google Drive, OneDrive",
    "description": "Maintain a findable folder structure."
  },
  {
    "id": "EA-I-009",
    "role": "EA",
    "level": "Intermediate",
    "category": "Calendar",
    "name": "Complex calendaring",
    "tools": "Google Calendar",
    "description": "Resolve multi-timezone priority conflicts."
  },
  {
    "id": "EA-I-010",
    "role": "EA",
    "level": "Intermediate",
    "category": "Travel",
    "name": "Itinerary management",
    "tools": "TripIt, Concur",
    "description": "Own end-to-end travel and logistics."
  },
  {
    "id": "EA-I-011",
    "role": "EA",
    "level": "Intermediate",
    "category": "Expense",
    "name": "Expense reporting",
    "tools": "Concur, RazorpayX, Zoho Expense",
    "description": "Reconcile and submit expenses."
  },
  {
    "id": "EA-I-012",
    "role": "EA",
    "level": "Intermediate",
    "category": "Meetings",
    "name": "Meeting prep & minutes",
    "tools": "Notion, Docs",
    "description": "Prepare agendas and capture actions."
  },
  {
    "id": "EA-I-013",
    "role": "EA",
    "level": "Intermediate",
    "category": "Gatekeeping",
    "name": "Access prioritisation",
    "tools": "--",
    "description": "Protect and prioritise executive time."
  },
  {
    "id": "EA-I-014",
    "role": "EA",
    "level": "Intermediate",
    "category": "Projects",
    "name": "Project coordination",
    "tools": "Asana, Trello",
    "description": "Track cross-team deliverables."
  },
  {
    "id": "EA-I-015",
    "role": "EA",
    "level": "Intermediate",
    "category": "Events",
    "name": "Event / offsite coordination",
    "tools": "--",
    "description": "Manage logistics and vendors."
  },
  {
    "id": "EA-I-016",
    "role": "EA",
    "level": "Intermediate",
    "category": "Reporting",
    "name": "Exec materials prep",
    "tools": "Sheets, Slides",
    "description": "Prepare decks and briefing packs."
  },
  {
    "id": "EA-A-017",
    "role": "EA",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Chief-of-staff functions",
    "tools": "Notion, dashboards",
    "description": "Drive priorities and follow-through."
  },
  {
    "id": "EA-A-018",
    "role": "EA",
    "level": "Advanced",
    "category": "Governance",
    "name": "Board meeting management",
    "tools": "--",
    "description": "Assemble board packs and minutes."
  },
  {
    "id": "EA-A-019",
    "role": "EA",
    "level": "Advanced",
    "category": "Communication",
    "name": "Drafting on exec's behalf",
    "tools": "--",
    "description": "Write in the executive's voice/tone."
  },
  {
    "id": "EA-A-020",
    "role": "EA",
    "level": "Advanced",
    "category": "Confidentiality",
    "name": "Sensitive-information handling",
    "tools": "--",
    "description": "Manage confidential matters with discretion."
  },
  {
    "id": "EA-A-021",
    "role": "EA",
    "level": "Advanced",
    "category": "Automation",
    "name": "Admin workflow automation",
    "tools": "Zapier, Make",
    "description": "Automate recurring administrative work."
  },
  {
    "id": "EA-A-022",
    "role": "EA",
    "level": "Advanced",
    "category": "Coordination",
    "name": "Cross-org coordination",
    "tools": "--",
    "description": "Align multiple teams and executives."
  },
  {
    "id": "EA-A-023",
    "role": "EA",
    "level": "Advanced",
    "category": "Budget",
    "name": "Budget tracking",
    "tools": "Sheets, ERP",
    "description": "Track departmental/exec budgets."
  },
  {
    "id": "EA-A-024",
    "role": "EA",
    "level": "Advanced",
    "category": "Prioritization",
    "name": "Executive time optimisation",
    "tools": "--",
    "description": "Ruthlessly optimise the exec's calendar."
  },
  {
    "id": "HR-B-001",
    "role": "HR",
    "level": "Basic",
    "category": "Recruitment",
    "name": "Job posting",
    "tools": "LinkedIn, Naukri, Indeed",
    "description": "Publish and manage openings."
  },
  {
    "id": "HR-B-002",
    "role": "HR",
    "level": "Basic",
    "category": "Recruitment",
    "name": "Resume screening",
    "tools": "ATS",
    "description": "Shortlist against role criteria."
  },
  {
    "id": "HR-B-003",
    "role": "HR",
    "level": "Basic",
    "category": "Scheduling",
    "name": "Interview scheduling",
    "tools": "Calendly, email",
    "description": "Coordinate interview panels."
  },
  {
    "id": "HR-B-004",
    "role": "HR",
    "level": "Basic",
    "category": "Onboarding",
    "name": "Onboarding basics",
    "tools": "HRIS",
    "description": "Set up new hires and paperwork."
  },
  {
    "id": "HR-B-005",
    "role": "HR",
    "level": "Basic",
    "category": "Records",
    "name": "Employee records",
    "tools": "Keka, Zoho People",
    "description": "Maintain accurate employee data."
  },
  {
    "id": "HR-B-006",
    "role": "HR",
    "level": "Basic",
    "category": "Communication",
    "name": "HR communication",
    "tools": "Email, Slack",
    "description": "Circulate policy and updates."
  },
  {
    "id": "HR-B-007",
    "role": "HR",
    "level": "Basic",
    "category": "Payroll",
    "name": "Payroll basics",
    "tools": "Keka, GreytHR",
    "description": "Understand attendance-to-pay flow."
  },
  {
    "id": "HR-B-008",
    "role": "HR",
    "level": "Basic",
    "category": "Compliance",
    "name": "Statutory awareness",
    "tools": "EPFO, ESIC portals",
    "description": "Know PF/ESI obligations."
  },
  {
    "id": "HR-I-009",
    "role": "HR",
    "level": "Intermediate",
    "category": "Recruitment",
    "name": "Full-cycle recruiting",
    "tools": "Greenhouse, Lever, Naukri",
    "description": "Run source-to-offer end to end."
  },
  {
    "id": "HR-I-010",
    "role": "HR",
    "level": "Intermediate",
    "category": "Sourcing",
    "name": "Talent sourcing",
    "tools": "LinkedIn Recruiter",
    "description": "Boolean search and candidate outreach."
  },
  {
    "id": "HR-I-011",
    "role": "HR",
    "level": "Intermediate",
    "category": "Interviewing",
    "name": "Structured interviewing",
    "tools": "ATS, scorecards",
    "description": "Evaluate consistently and fairly."
  },
  {
    "id": "HR-I-012",
    "role": "HR",
    "level": "Intermediate",
    "category": "Onboarding",
    "name": "Structured onboarding",
    "tools": "HRIS, Notion",
    "description": "Run 30-60-90 onboarding plans."
  },
  {
    "id": "HR-I-013",
    "role": "HR",
    "level": "Intermediate",
    "category": "Payroll",
    "name": "Payroll processing",
    "tools": "GreytHR, Keka, RazorpayX",
    "description": "Run accurate monthly payroll."
  },
  {
    "id": "HR-I-014",
    "role": "HR",
    "level": "Intermediate",
    "category": "Compliance",
    "name": "Statutory compliance",
    "tools": "EPFO, ESIC, PT, TDS",
    "description": "Meet filing deadlines correctly."
  },
  {
    "id": "HR-I-015",
    "role": "HR",
    "level": "Intermediate",
    "category": "Engagement",
    "name": "Employee engagement",
    "tools": "Officevibe, surveys",
    "description": "Run pulse surveys and act on them."
  },
  {
    "id": "HR-I-016",
    "role": "HR",
    "level": "Intermediate",
    "category": "Performance",
    "name": "Performance management",
    "tools": "Lattice, Keka",
    "description": "Manage goals and appraisal cycles."
  },
  {
    "id": "HR-I-017",
    "role": "HR",
    "level": "Intermediate",
    "category": "Policy",
    "name": "Policy documentation",
    "tools": "--",
    "description": "Maintain handbook and leave/WFH policies."
  },
  {
    "id": "HR-I-018",
    "role": "HR",
    "level": "Intermediate",
    "category": "L&D",
    "name": "Training coordination",
    "tools": "LMS",
    "description": "Schedule and track training."
  },
  {
    "id": "HR-I-019",
    "role": "HR",
    "level": "Intermediate",
    "category": "Relations",
    "name": "Employee relations",
    "tools": "--",
    "description": "Handle grievances at first level."
  },
  {
    "id": "HR-A-020",
    "role": "HR",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Workforce planning",
    "tools": "--",
    "description": "Tie headcount plan to strategy."
  },
  {
    "id": "HR-A-021",
    "role": "HR",
    "level": "Advanced",
    "category": "Compensation",
    "name": "Comp & benefits design",
    "tools": "--",
    "description": "Design bands and benchmark pay."
  },
  {
    "id": "HR-A-022",
    "role": "HR",
    "level": "Advanced",
    "category": "Compensation",
    "name": "ESOP administration",
    "tools": "--",
    "description": "Manage grants, vesting and cap-table coord."
  },
  {
    "id": "HR-A-023",
    "role": "HR",
    "level": "Advanced",
    "category": "Culture",
    "name": "Culture programs",
    "tools": "--",
    "description": "Design and run culture initiatives."
  },
  {
    "id": "HR-A-024",
    "role": "HR",
    "level": "Advanced",
    "category": "Analytics",
    "name": "People analytics",
    "tools": "Power BI, HRIS",
    "description": "Track attrition, cost-per-hire, DEI."
  },
  {
    "id": "HR-A-025",
    "role": "HR",
    "level": "Advanced",
    "category": "Compliance",
    "name": "Labour-law governance",
    "tools": "--",
    "description": "Shops & Establishments, POSH, contracts."
  },
  {
    "id": "HR-A-026",
    "role": "HR",
    "level": "Advanced",
    "category": "Org Design",
    "name": "Organisation design",
    "tools": "--",
    "description": "Structure roles, spans and layers."
  },
  {
    "id": "HR-A-027",
    "role": "HR",
    "level": "Advanced",
    "category": "Leadership",
    "name": "Leadership hiring",
    "tools": "--",
    "description": "Run senior and executive search."
  },
  {
    "id": "HR-A-028",
    "role": "HR",
    "level": "Advanced",
    "category": "Change",
    "name": "Change management",
    "tools": "--",
    "description": "Lead restructures and people integration."
  },
  {
    "id": "HR-A-029",
    "role": "HR",
    "level": "Advanced",
    "category": "Business Partner",
    "name": "HR business partnering",
    "tools": "--",
    "description": "Advise leadership on people strategy."
  },
  {
    "id": "ADM-B-001",
    "role": "Admin",
    "level": "Basic",
    "category": "Office",
    "name": "Office management",
    "tools": "--",
    "description": "Run supplies, upkeep and front desk."
  },
  {
    "id": "ADM-B-002",
    "role": "Admin",
    "level": "Basic",
    "category": "Vendors",
    "name": "Vendor coordination",
    "tools": "--",
    "description": "Liaise day-to-day with suppliers."
  },
  {
    "id": "ADM-B-003",
    "role": "Admin",
    "level": "Basic",
    "category": "Records",
    "name": "Document filing",
    "tools": "Google Drive",
    "description": "Maintain physical and digital records."
  },
  {
    "id": "ADM-B-004",
    "role": "Admin",
    "level": "Basic",
    "category": "Communication",
    "name": "Reception & inquiries",
    "tools": "Phone, email",
    "description": "Handle incoming inquiries professionally."
  },
  {
    "id": "ADM-B-005",
    "role": "Admin",
    "level": "Basic",
    "category": "Scheduling",
    "name": "Room / resource booking",
    "tools": "Google Calendar",
    "description": "Manage meeting rooms and resources."
  },
  {
    "id": "ADM-B-006",
    "role": "Admin",
    "level": "Basic",
    "category": "Procurement",
    "name": "Basic procurement",
    "tools": "--",
    "description": "Order routine supplies."
  },
  {
    "id": "ADM-B-007",
    "role": "Admin",
    "level": "Basic",
    "category": "Travel",
    "name": "Travel desk basics",
    "tools": "Booking sites",
    "description": "Book staff travel."
  },
  {
    "id": "ADM-B-008",
    "role": "Admin",
    "level": "Basic",
    "category": "Assets",
    "name": "Asset tracking",
    "tools": "Sheets",
    "description": "Log and tag equipment."
  },
  {
    "id": "ADM-I-009",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Procurement",
    "name": "Vendor management",
    "tools": "--",
    "description": "Negotiate rates and manage contracts."
  },
  {
    "id": "ADM-I-010",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Facilities",
    "name": "Facilities management",
    "tools": "--",
    "description": "Oversee maintenance, security, housekeeping."
  },
  {
    "id": "ADM-I-011",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Compliance",
    "name": "Licenses & statutory",
    "tools": "GST portal, local licenses",
    "description": "Track renewals and filings."
  },
  {
    "id": "ADM-I-012",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Finance",
    "name": "Petty cash & expenses",
    "tools": "Tally, Zoho Books",
    "description": "Reconcile admin expenses."
  },
  {
    "id": "ADM-I-013",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Events",
    "name": "Event coordination",
    "tools": "--",
    "description": "Handle internal-event logistics."
  },
  {
    "id": "ADM-I-014",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Assets",
    "name": "Asset lifecycle",
    "tools": "Sheets, asset tools",
    "description": "Manage procure-to-retire."
  },
  {
    "id": "ADM-I-015",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Travel",
    "name": "Travel & logistics ops",
    "tools": "Concur",
    "description": "Own end-to-end travel operations."
  },
  {
    "id": "ADM-I-016",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Safety",
    "name": "Workplace safety",
    "tools": "--",
    "description": "Maintain fire/safety compliance."
  },
  {
    "id": "ADM-I-017",
    "role": "Admin",
    "level": "Intermediate",
    "category": "Contracts",
    "name": "Contract administration",
    "tools": "DocuSign",
    "description": "Track contract renewals and terms."
  },
  {
    "id": "ADM-A-018",
    "role": "Admin",
    "level": "Advanced",
    "category": "Strategy",
    "name": "Facilities strategy",
    "tools": "--",
    "description": "Plan space, expansion and leases."
  },
  {
    "id": "ADM-A-019",
    "role": "Admin",
    "level": "Advanced",
    "category": "Procurement",
    "name": "Strategic sourcing",
    "tools": "--",
    "description": "Consolidate vendors and cut cost."
  },
  {
    "id": "ADM-A-020",
    "role": "Admin",
    "level": "Advanced",
    "category": "Finance",
    "name": "Admin budgeting",
    "tools": "Tally, ERP",
    "description": "Own and manage the admin budget."
  },
  {
    "id": "ADM-A-021",
    "role": "Admin",
    "level": "Advanced",
    "category": "Governance",
    "name": "Policy & SOP design",
    "tools": "--",
    "description": "Standardise administrative processes."
  },
  {
    "id": "ADM-A-022",
    "role": "Admin",
    "level": "Advanced",
    "category": "Compliance",
    "name": "Regulatory governance",
    "tools": "GST, Shops & Est., labour",
    "description": "Run multi-site compliance."
  },
  {
    "id": "ADM-A-023",
    "role": "Admin",
    "level": "Advanced",
    "category": "Vendors",
    "name": "Vendor governance",
    "tools": "--",
    "description": "Manage SLAs, audits and performance."
  },
  {
    "id": "ADM-A-024",
    "role": "Admin",
    "level": "Advanced",
    "category": "Continuity",
    "name": "Business continuity",
    "tools": "--",
    "description": "Build BCP and ops disaster recovery."
  },
  {
    "id": "ADM-A-025",
    "role": "Admin",
    "level": "Advanced",
    "category": "Multi-site",
    "name": "Multi-location administration",
    "tools": "--",
    "description": "Coordinate admin across offices."
  },
  ...additionalRoleSkillCatalog
] as const;

export type CatalogRole = typeof roleSkillCatalog[number]["role"];
export type CatalogSkill = typeof roleSkillCatalog[number];
