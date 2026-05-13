# Mock Data untuk Development

Folder ini berisi mock data untuk keperluan development dan testing sebelum backend API ready.

## Cara Menggunakan

### 1. **Enable Mock Data**

Edit file `src/mocks/recordingData.js`:

```javascript
export const USE_MOCK_DATA = true; // Set to true untuk menggunakan mock data
```

### 2. **Disable Mock Data (Gunakan Real API)**

```javascript
export const USE_MOCK_DATA = false; // Set to false untuk menggunakan real API
```

## Data yang Tersedia

### `mockRecordingsData`
- 12 recording items dengan berbagai kombinasi:
  - Site Location: FedEx Hub, Changi Hub
  - Recording Type: Continuous Recording, Event Recording
  - Events Count: 5-45 events
  - File Size: 0.95 Gb - 5.20 Gb
  - Date Range: Mar 17-23, 2025

### `mockStationsData`
- 3 stations untuk Area dropdown

### `mockCamerasData` ⭐ **NEW - 15 Cameras**
- **15 cameras** untuk Camera dropdown dengan detail:
  - **FedEx Hub Cameras (9)**:
    - Changi_Hub_Cam_001 (Camp Area)
    - Changi_Hub_Cam_002 (Parking Area)
    - Parking_Cam_001 (Parking Area)
    - Parking_Cam_002 (Parking Area)
    - Camp_Cam_001 (Camp Area)
    - FedEx_Hub_Main_Cam (Camp Area)
    - Loading_Bay_Cam_001 (Camp Area)
    - Loading_Bay_Cam_002 (Camp Area) - **OFFLINE**
  - **Changi Hub Cameras (6)**:
    - FedEx_Cam_001 (Camp Area)
    - FedEx_Cam_002 (Parking Area)
    - Gate_Cam_001 (Entrance Gate)
    - Camp_Cam_002 (Camp Area)
    - Changi_Hub_Main_Cam (Camp Area)
    - Entrance_Cam_001 (Entrance Gate)
    - Security_Gate_Cam (Entrance Gate)

## Fitur Mock Data

✅ **Search** - Filter by recording ID atau title
✅ **Site Location Filter** - Filter by site location
✅ **Area Filter** - Multi-select, filter by multiple areas
✅ **Camera Filter** - Multi-select, filter by multiple cameras (15 options)
✅ **Pagination** - Support pagination dengan 12 items per page
✅ **Loading Simulation** - 500ms delay untuk recordings, 300ms untuk cameras
✅ **Console Indicators**:
   - 🎭 Orange badge untuk recordings mock data
   - 📹 Cyan badge untuk cameras mock data

## Testing Scenarios

### Test 1: Search
- Input: "REC-001"
- Expected: Menampilkan 1 recording dengan ID REC-001

### Test 2: Filter by Site
- Select: FedEx Hub
- Expected: Menampilkan recordings dari FedEx Hub saja

### Test 3: Filter by Multiple Areas
- Select: Camp Area, Parking Area
- Expected: Menampilkan recordings dari kedua area

### Test 4: Empty State
- Search: "NONEXISTENT"
- Expected: Menampilkan empty state

### Test 5: Camera Multi-Select
- Select Camera: "Changi_Hub_Cam_001", "FedEx_Cam_001"
- Klik "Search"
- Expected: Menampilkan recordings dari kedua camera

### Test 6: Camera with Area
- Select Area: "Camp Area"
- Select Camera: "Camp_Cam_001"
- Klik "Search"
- Expected: Menampilkan recordings yang match kedua filter

## Camera Details

### By Site Location:
- **FedEx Hub**: 9 cameras (8 online, 1 offline)
- **Changi Hub**: 6 cameras (all online)

### By Area:
- **Camp Area**: 7 cameras
- **Parking Area**: 4 cameras
- **Entrance Gate**: 3 cameras

### Special Cases:
- **Loading_Bay_Cam_002**: Status OFFLINE (untuk test filter by status)

## Notes

⚠️ **IMPORTANT**: Jangan lupa set `USE_MOCK_DATA = false` ketika backend API sudah ready!

📹 **Camera Mock Data** juga akan otomatis aktif ketika `USE_MOCK_DATA = true` dan digunakan untuk populate dropdown Camera(s)
