import os

with open("src/pages/rides/RideDetailPage.tsx", "r") as f:
    content = f.read()

# Reduce padding [FIX-09]
content = content.replace("className=\"card p-8 border-none shadow-xl", "className=\"card p-5 border-none shadow-sm")
content = content.replace("className=\"relative py-10 px-6 bg-gray-900 rounded-3xl mb-8", "className=\"relative py-5 px-5 bg-gray-900 rounded-2xl mb-4")

# Reduce gaps and margins
content = content.replace("mb-8", "mb-4")
content = content.replace("gap-6 mb-4 pt-6", "gap-4 mb-4 pt-4")
content = content.replace("gap-6 mb-8 pt-6", "gap-4 mb-4 pt-4")

# Driver cancel button [DELETE-02]
cancel_btn = """
          <button onClick={() => setCancelRideModal(true)}
            className="py-2.5 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 col-span-2">
            <XCircle className="h-4 w-4" /> Cancel Ride
          </button>
"""
# We'll just insert this near the Edit button if we can find it
import re
if 'className="py-2.5 text-sm font-bold text-primary-600' in content:
    content = content.replace('className="py-2.5 text-sm font-bold text-primary-600 bg-primary-50 border border-primary-100 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">', 
                              'className="py-2.5 text-sm font-bold text-primary-600 bg-primary-50 border border-primary-100 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">\n' + cancel_btn)
else:
    # Append XCircle to imports
    if 'XCircle' not in content:
        content = content.replace('import {', 'import { XCircle,', 1)

with open("src/pages/rides/RideDetailPage.tsx", "w") as f:
    f.write(content)

print("Fixed RideDetailPage.tsx")
