"""
Synthetic dataset generator for Frisk demo mode.
Produces realistic transaction + order CSV files.
"""

import os
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__))
TRANSACTIONS_PATH = os.path.join(DATA_DIR, "transactions_demo.csv")
ORDERS_PATH = os.path.join(DATA_DIR, "orders_demo.csv")

CATEGORIES = ["Electronics", "Clothing", "Food", "Travel", "Gaming", "Health", "Books", "Home"]
REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"]
DEVICES = ["mobile", "desktop", "tablet", "pos_terminal"]
COUNTRIES = ["US", "GB", "DE", "FR", "CA", "AU", "SG", "BR", "IN", "JP"]


def generate_transactions(n: int = 600, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    n_normal = int(n * 0.85)
    n_fraud = n - n_normal

    # Normal transactions
    normal = pd.DataFrame({
        "transaction_id": [f"TXN{i:05d}" for i in range(n_normal)],
        "amount": rng.lognormal(mean=4.5, sigma=1.2, size=n_normal).round(2),
        "merchant_category": rng.choice(CATEGORIES, size=n_normal),
        "num_transactions_24h": rng.integers(1, 12, size=n_normal),
        "time_of_day": rng.integers(6, 23, size=n_normal),   # hour 0-23
        "country": rng.choice(COUNTRIES[:5], size=n_normal),  # mostly domestic
        "is_international": rng.choice([0, 0, 0, 1], size=n_normal),
        "device_type": rng.choice(DEVICES, size=n_normal),
        "customer_age_days": rng.integers(90, 2000, size=n_normal),
        "prev_chargebacks": rng.integers(0, 2, size=n_normal),
        "fraud_label": 0,
    })

    # Fraudulent transactions — unusual patterns
    fraud_df = pd.DataFrame({
        "transaction_id": [f"TXN{n_normal + i:05d}" for i in range(n_fraud)],
        "amount": rng.lognormal(mean=6.5, sigma=1.5, size=n_fraud).round(2),
        "merchant_category": rng.choice(CATEGORIES, size=n_fraud),
        "num_transactions_24h": rng.integers(15, 50, size=n_fraud),
        "time_of_day": rng.integers(0, 5, size=n_fraud),    # late night
        "country": rng.choice(COUNTRIES, size=n_fraud),
        "is_international": rng.choice([1, 1, 0], size=n_fraud),
        "device_type": rng.choice(DEVICES, size=n_fraud),
        "customer_age_days": rng.integers(0, 30, size=n_fraud),  # new account
        "prev_chargebacks": rng.integers(1, 5, size=n_fraud),
        "fraud_label": 1,
    })

    df = pd.concat([normal, fraud_df], ignore_index=True)
    df["timestamp"] = pd.date_range(start="2024-01-01", periods=len(df), freq="5min").astype(str)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


def generate_orders(n: int = 600, seed: int = 99) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    df = pd.DataFrame({
        "order_id": [f"ORD{i:05d}" for i in range(n)],
        "product_category": rng.choice(CATEGORIES, size=n),
        "customer_return_rate": rng.beta(2, 5, size=n).round(3),   # 0-1
        "order_value": rng.lognormal(mean=4.2, sigma=1.0, size=n).round(2),
        "region": rng.choice(REGIONS, size=n),
        "days_since_last_order": rng.integers(0, 365, size=n),
        "customer_age_days": rng.integers(1, 1500, size=n),
        "num_prev_orders": rng.integers(0, 50, size=n),
        "is_gift": rng.integers(0, 2, size=n),
    })

    # Return probability increases with: high order value, high return rate, short tenure
    score = (
        0.3 * (df["customer_return_rate"] > 0.3).astype(int)
        + 0.25 * (df["order_value"] > 200).astype(int)
        + 0.2 * (df["customer_age_days"] < 60).astype(int)
        + 0.15 * (df["days_since_last_order"] < 7).astype(int)
        + 0.1 * df["is_gift"]
    )
    noise = rng.uniform(-0.1, 0.1, size=n)
    df["return_label"] = ((score + noise) > 0.35).astype(int)
    return df


def seed_data():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(TRANSACTIONS_PATH):
        df = generate_transactions()
        df.to_csv(TRANSACTIONS_PATH, index=False)
        print(f"✅  Seeded {len(df)} transactions → {TRANSACTIONS_PATH}")
    if not os.path.exists(ORDERS_PATH):
        df = generate_orders()
        df.to_csv(ORDERS_PATH, index=False)
        print(f"✅  Seeded {len(df)} orders → {ORDERS_PATH}")


if __name__ == "__main__":
    seed_data()
