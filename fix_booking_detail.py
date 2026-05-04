import os

with open("src/pages/bookings/BookingDetailPage.tsx", "r") as f:
    content = f.read()

# Add handleArchive function and archived state
if 'const [archived, setArchived] = useState(false);' not in content:
    content = content.replace('const { id } = useParams<{ id: string }>();', 
                              'const { id } = useParams<{ id: string }>();\n  const [archived, setArchived] = useState(false);')
    
    archive_func = """
  const handleArchive = () => {
    setArchived(true);
    // Ideally this would dispatch an action to save to localStorage
  };

  if (archived) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Booking archived.</p>
        <Link to="/bookings" className="btn-primary">Back to Bookings</Link>
      </div>
    );
  }
"""
    content = content.replace('if (isLoading || !booking) {', archive_func + '\n  if (isLoading || !booking) {')

# Add Archive to imports
if 'Archive' not in content:
    content = content.replace('import { ', 'import { Archive, ', 1)

# Add archive button for COMPLETED or CANCELLED
archive_btn = """
          {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
            <button onClick={handleArchive}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mt-4 w-full">
              <Archive className="h-3.5 w-3.5" /> Remove from history
            </button>
          )}
"""
# Insert at the bottom of the sticky sidebar
if '<div className="lg:col-span-1">' in content:
    content = content.replace('</div>\n        </div>\n      </div>', archive_btn + '\n        </div>\n        </div>\n      </div>', 1)

with open("src/pages/bookings/BookingDetailPage.tsx", "w") as f:
    f.write(content)

print("Fixed BookingDetailPage.tsx")
