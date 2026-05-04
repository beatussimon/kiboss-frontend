import re
import os

with open("src/pages/profile/PaymentsPage.tsx", "r") as f:
    content = f.read()

# 1. Colors
content = content.replace("text-warning-500", "text-amber-500")
content = content.replace("bg-warning-50", "bg-amber-50")
content = content.replace("text-success-500", "text-green-500")
content = content.replace("text-error-500", "text-red-500")

# 2. Remove ESCROW case
content = re.sub(r"case 'ESCROW':\s*return <Shield className=\"h-4 w-4 text-amber-500\" />;\s*", "", content)
content = re.sub(r"<span className=\"text-xs text-gray-400 mt-1\">Pending verification</span>\s*", "", content)

# 3. Rename Security Hold to Pending Confirmation
content = content.replace("Security Hold", "Pending Confirmation")
content = content.replace("Funds held in secure escrow for active bookings", "Submitted payments awaiting owner confirmation")

# 4. Download CSV
csv_code = """onClick={() => {
              const csv = payments.map((p: any) => `${p.id},${p.created_at},${p.payment_method},${p.status},${p.amount}`).join('\\n');
              const blob = new Blob([`ID,Date,Method,Status,Amount\\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
            }}"""
content = content.replace("<button className=\"text-sm font-medium text-primary-600 hover:text-primary-700\">Download CSV</button>", f"<button {csv_code} className=\"text-sm font-medium text-primary-600 hover:text-primary-700\">Download CSV</button>")

with open("src/pages/profile/PaymentsPage.tsx", "w") as f:
    f.write(content)

print("Fixed PaymentsPage.tsx")
