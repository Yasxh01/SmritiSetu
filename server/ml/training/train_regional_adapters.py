import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Train regional adapters")
    parser.add_argument("--dry-run", action="store_true", help="Run without training")
    args = parser.parse_args()

    if args.dry_run:
        print("Dry run complete.")
        sys.exit(0)
    
    print("Training adapters...")

if __name__ == "__main__":
    main()
