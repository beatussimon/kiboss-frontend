interface Props {
  assetType: string;
  properties: any;
  onChange: (key: string, value: any) => void;
}

export function DynamicAssetFields({ assetType, properties, onChange }: Props) {
  if (!assetType) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      onChange(name, (e.target as HTMLInputElement).checked);
    } else {
      onChange(name, value);
    }
  };

  switch (assetType) {
    case 'VEHICLE':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Make</label>
            <input type="text" name="make" value={properties.make || ''} onChange={handleChange} className="input" placeholder="e.g. Toyota" />
          </div>
          <div>
            <label className="label">Model</label>
            <input type="text" name="model" value={properties.model || ''} onChange={handleChange} className="input" placeholder="e.g. Alphard" />
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" name="year" value={properties.year || ''} onChange={handleChange} className="input" placeholder="e.g. 2018" />
          </div>
          <div>
            <label className="label">License Plate</label>
            <input type="text" name="license_plate" value={properties.license_plate || ''} onChange={handleChange} className="input" placeholder="e.g. T 123 ABC" />
          </div>
          <div>
            <label className="label">Seat Capacity</label>
            <input type="number" name="seat_capacity" value={properties.seat_capacity || ''} onChange={handleChange} className="input" />
          </div>
          <div className="flex items-center mt-6">
            <input type="checkbox" id="ac" name="ac" checked={properties.ac || false} onChange={handleChange} className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <label htmlFor="ac" className="text-sm font-bold text-gray-700">Air Conditioning (AC)</label>
          </div>
        </div>
      );

    case 'ROOM':
    case 'HOTEL_ROOM':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Room Type</label>
            <select name="room_type" value={properties.room_type || ''} onChange={handleChange} className="input">
              <option value="">Select type</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
              <option value="Deluxe">Deluxe</option>
            </select>
          </div>
          <div>
            <label className="label">Floor</label>
            <input type="text" name="floor" value={properties.floor || ''} onChange={handleChange} className="input" placeholder="e.g. 2nd Floor" />
          </div>
          <div>
            <label className="label">Bed Type</label>
            <select name="bed_type" value={properties.bed_type || ''} onChange={handleChange} className="input">
              <option value="">Select bed</option>
              <option value="Single">Single Bed</option>
              <option value="Double">Double Bed</option>
              <option value="Queen">Queen Size</option>
              <option value="King">King Size</option>
            </select>
          </div>
          <div>
            <label className="label">Max Guests</label>
            <input type="number" name="max_guests" value={properties.max_guests || ''} onChange={handleChange} className="input" />
          </div>
        </div>
      );

    case 'RECORDING_STUDIO':
      return (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Studio Type</label>
              <select name="studio_type" value={properties.studio_type || ''} onChange={handleChange} className="input">
                <option value="">Select type</option>
                <option value="Audio">Audio Recording</option>
                <option value="Video">Video / Photo</option>
                <option value="Podcast">Podcast</option>
              </select>
            </div>
            <div>
              <label className="label">Minimum Hours</label>
              <input type="number" name="min_hours" value={properties.min_hours || ''} onChange={handleChange} className="input" />
            </div>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="engineer" name="engineer_included" checked={properties.engineer_included || false} onChange={handleChange} className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="engineer" className="text-sm font-bold text-gray-700">Sound/Video Engineer Included</label>
          </div>
          <div>
            <label className="label">Equipment List</label>
            <textarea name="equipment_list" value={properties.equipment_list || ''} onChange={handleChange} className="input h-24" placeholder="List available microphones, cameras, software, etc." />
          </div>
        </div>
      );

    case 'CONFERENCE_HALL':
    case 'EVENT_VENUE':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Max Seated Capacity</label>
            <input type="number" name="max_capacity_seated" value={properties.max_capacity_seated || ''} onChange={handleChange} className="input" />
          </div>
          <div className="flex items-center mt-6">
            <input type="checkbox" id="av" name="av_equipment" checked={properties.av_equipment || false} onChange={handleChange} className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="av" className="text-sm font-bold text-gray-700">AV Equipment Available</label>
          </div>
          <div className="flex items-center mt-6 md:col-span-2">
            <input type="checkbox" id="catering" name="in_house_catering" checked={properties.in_house_catering || false} onChange={handleChange} className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="catering" className="text-sm font-bold text-gray-700">In-House Catering Available</label>
          </div>
        </div>
      );

    case 'TOOL':
    case 'CONSTRUCTION_TOOL':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Brand</label>
            <input type="text" name="brand" value={properties.brand || ''} onChange={handleChange} className="input" placeholder="e.g. Bosch, Makita" />
          </div>
          <div>
            <label className="label">Model</label>
            <input type="text" name="model" value={properties.model || ''} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Condition</label>
            <select name="condition" value={properties.condition || ''} onChange={handleChange} className="input">
              <option value="">Select condition</option>
              <option value="New">New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>
          <div className="flex items-center mt-6">
            <input type="checkbox" id="operator" name="requires_operator" checked={properties.requires_operator || false} onChange={handleChange} className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="operator" className="text-sm font-bold text-gray-700">Requires Professional Operator</label>
          </div>
        </div>
      );

    default:
      return null;
  }
}
