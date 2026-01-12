import Papa from 'papaparse';
import { Transaction } from '../models/Transaction';

export const TransactionService = {
  async getTransactionsFromCSV(csvString: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: false, // The CSV does not have a consistent header row
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const transactions: Transaction[] = results.data
              .map((row: any, index: number) => {
                // This mapping is based on the observed structure of Aerocity_Transactions_Dec25_Updated.csv
                // It might need adjustments if the CSV format changes.
                
                // Example of a row to parse:
                // ["Rent","₹ 18,000.00","Db","Yes",,"F","9.33",,"Rent",,"1-Jan","₹ 1,065.00","Travel"]
                
                // We'll look for rows that appear to be transactions.
                // A simple heuristic: the row has a detail, amount, and Cr/Db status.
                if (row.length > 3 && (row[2] === 'Cr' || row[2] === 'Db')) {
                  const detail = row[0];
                  const amountString = row[1].replace(/[^0-9.-]+/g, '');
                  const amount = parseFloat(amountString);
                  const type = row[2] as 'Cr' | 'Db';
                  const status = row[3];
                  
                  // Attempt to find a date and category from the latter part of the row
                  let date = new Date(); // Default to now if not found
                  let category = row[8] || 'Uncategorized'; // Use column I as category if available

                  // Look for a date in the row
                  for (let i = 4; i < row.length; i++) {
                    // A simple check for something that looks like a date "1-Jan"
                    if (typeof row[i] === 'string' && /^\d{1,2}-[A-Za-z]{3}$/.test(row[i])) {
                       // This is a naive date parsing. For production, a more robust library should be used.
                       const parts = row[i].split('-');
                       const day = parseInt(parts[0], 10);
                       const monthName = parts[1];
                       const monthMap: { [key: string]: number } = {
                         'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                         'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                       };
                       const month = monthMap[monthName];
                       const year = new Date().getFullYear(); // Assume current year
                       date = new Date(year, month, day);

                       // Let's assume the category is the next column if it exists
                       if(row.length > i+2) {
                         category = row[i+2] || category;
                       }
                       break;
                    }
                  }


                  return {
                    id: `${index}`,
                    detail,
                    amount,
                    type,
                    status,
                    category,
                    date,
                  };
                }
                return null;
              })
              .filter((t): t is Transaction => t !== null);

            resolve(transactions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  },
};
