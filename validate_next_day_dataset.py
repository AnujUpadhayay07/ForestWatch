import pandas as pd

path = "data/next_day_fire_dataset.csv"

df = pd.read_csv(path, parse_dates=["DATE"])

print("\n========== COLUMN CHECK ==========")
for column in df.columns:
    print(repr(column))

print("\n========== DATASET SHAPE ==========")
print("Rows:", len(df))
print("Columns:", len(df.columns))
print("Duplicate dates:", df["DATE"].duplicated().sum())
print("Missing values:", int(df.isna().sum().sum()))

print("\n========== TARGET DISTRIBUTION ==========")
print(df["FIRE_START_DAY"].value_counts(dropna=False))

print("\n========== FIRST 5 ROWS ==========")
print(df.head().to_string(index=False))

print("\n========== DATE CONTINUITY ==========")
gaps = df["DATE"].diff().dropna()
print("Non-daily gaps:", int((gaps != pd.Timedelta(days=1)).sum()))

print("\n========== SAVED FILE CHECK ==========")
print("Validation completed.")
