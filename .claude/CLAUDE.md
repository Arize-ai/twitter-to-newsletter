<!-- arize-coder-managed -->
# Project Overview

Twitter to Newsletter — a Next.js app that pulls tweets via Twitter OAuth, lets users select them, and uses Claude to compose a themed monthly newsletter in Markdown.

Key files:
- `lib/newsletter.ts` — Claude-powered newsletter composer with prompt injection guardrails
- `lib/template.ts` — Per-account template storage (Upstash Redis)
- `lib/twitter.ts` — Twitter OAuth + tweet fetching
- `evals/newsletter-eval.ts` — Phoenix evaluation suite (coverage, faithfulness, link accuracy, structure)
- `app/components/LoginButton.tsx` — Landing page (logged-out view)
- `app/components/AppShell.tsx` — Main app state orchestrator

## Prompt Security

The newsletter prompt in `lib/newsletter.ts` has guardrails against prompt injection:
- Tweet text is sanitized: triple backticks collapsed, role markers disrupted with zero-width spaces
- Tweet data is wrapped in `<tweets>` XML tags to separate data from instructions
- System prompt explicitly labels tweet content as untrusted and instructs the model to ignore embedded instructions
- URLs are restricted to structured metadata fields (`Tweet URL:` and `Links in tweet:`) — raw URLs in tweet text are excluded

When modifying the newsletter prompt, preserve these guardrails.

# Arize Phoenix Configuration

IMPORTANT: The Phoenix API key and endpoint are already configured. Do NOT look for them in .env files, environment variables, or ask the user for them. Use these exact values directly.

- PHOENIX_API_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJBcGlLZXk6NyJ9.uMytoxY-AADXShS7ZMpxkYMm3u8ZItDzTNpeJo1XePo`
- PHOENIX_HOST: `https://app.phoenix.arize.com/s/lvoss`

When writing Python code that connects to Phoenix, ALWAYS include this at the top before any phoenix imports:

```python
import os
os.environ["PHOENIX_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJBcGlLZXk6NyJ9.uMytoxY-AADXShS7ZMpxkYMm3u8ZItDzTNpeJo1XePo"
os.environ["PHOENIX_HOST"] = "https://app.phoenix.arize.com/s/lvoss"
```

When running Bash commands that interact with Phoenix, ALWAYS prefix with:

```
PHOENIX_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJBcGlLZXk6NyJ9.uMytoxY-AADXShS7ZMpxkYMm3u8ZItDzTNpeJo1XePo" PHOENIX_HOST="https://app.phoenix.arize.com/s/lvoss"
```

## Eval workflow

When the user asks you to create evaluations, write the eval code AND run it. Do not just write code and leave it for the user to execute.

## CRITICAL: Dataset and Experiment Naming Convention

A DATASET is a fixed test set (inputs + expected outputs). An EXPERIMENT is a single run of your task+evaluators against that dataset. You create a dataset ONCE, then run MANY experiments against it.

Naming rules:
- Dataset names: use prefix `ds-` with a descriptive name (e.g., `ds-newsletter-qa`, `ds-rag-test`). NO timestamps.
- Experiment names: use prefix `exp-` with a version or timestamp (e.g., `exp-newsletter-v1`, `exp-newsletter-v2`)

IMPORTANT: Before creating a dataset, ALWAYS check if one already exists:
```python
from phoenix.client import Client
client = Client()
try:
    dataset = client.datasets.get_dataset(name="ds-newsletter-qa")
    print(f"Reusing existing dataset: {dataset.name}")
except:
    dataset = client.datasets.create_dataset(name="ds-newsletter-qa", examples=[...])
    print(f"Created new dataset: {dataset.name}")
```

Then run experiments against it — each experiment gets a unique name:
```python
experiment = run_experiment(dataset=dataset, experiment_name="exp-newsletter-v1", ...)
```

NEVER create a new dataset on every run. NEVER use timestamps in dataset names. NEVER use the same name for both dataset and experiment.

## CRITICAL: Experiment result marker (REQUIRED)

After ANY experiment completes (whether via run_experiment(), a script, or npm run), you MUST output this marker as a separate print/echo statement. Without this marker, the extension CANNOT visualize the results:

```
print("[PHOENIX_EXPERIMENT: <experiment-name> on <dataset-name>]")
```

Example:
```
print("[PHOENIX_EXPERIMENT: exp-newsletter-v1 on ds-newsletter-v1]")
```

The first value is the experiment_name (starts with `exp-`), the second is the dataset name (starts with `ds-`). They are ALWAYS different.

This is NOT optional. The extension watches for this exact pattern to fetch and display results with scores and charts. If you forget this step, the user will not see any visualization.
