import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { UserContext } from '../../contexts/authContext';
import { Ionicons } from '@expo/vector-icons';



const cities = [
  "Acre (Akko)", "Afula", "Arad", "Ashdod", "Ashkelon", "Bat Yam", "Be'er Ora", "Be'er Ya'akov",
  "Be'er Sheva", "Beit She'an", "Beit Shemesh", "Binyamina", "Bnei Brak", "Caesarea", "Dimona",
  "Eilat", "El'ad", "Even Yehuda", "Giv'at Ze'ev", "Givat Shmuel", "Givatayim", "Haifa",
  "Hadera", "Herzliya", "Hod Hasharon", "Holon", "Jerusalem", "Karmiel", "Kfar Saba", "Kfar Yona",
  "Kiryat Ata", "Kiryat Bialik", "Kiryat Gat", "Kiryat Motzkin", "Kiryat Ono", "Kiryat Yam",
  "Lehavim", "Lod", "Ma'ale Adumim", "Ma'alot-Tarshiha", "Megiddo", "Meitar", "Mevaseret Zion",
  "Migdal", "Migdal HaEmek", "Mitzpe Ramon", "Modi'in", "Nahariya", "Nazareth", "Nazareth Illit",
  "Nesher", "Ness Ziona", "Netanya", "Netivot", "Omer", "Or Akiva", "Or Yehuda", "Pardes Hanna",
  "Petah Tikva", "Ra'anana", "Rahath", "Ramla", "Ramat Gan", "Ramat HaSharon", "Rehovot",
  "Rishon LeZion", "Rosh HaAyin", "Rosh Pina", "Sderot", "Shoham", "Tel Aviv", "Tiberias",
  "Timna", "Tirat Carmel", "Tzfat (Safed)", "Yavne", "Yavne'el", "Yehud", "Yeruham", "Yokneam",
  "Yotvata", "Zikhron Ya'akov"
].sort();

interface FiltersBarProps {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  location: string;
  setLocation: (loc: string) => void;
  duration: string;
  setDuration: (dur: string) => void;
  filterRequests: boolean;
  setFilterRequests: (val: boolean) => void;
  filterMine: boolean;
  setFilterMine: (val: boolean) => void;
  nearby: boolean;
  setNearby: (val: boolean) => void;
  resetTrigger: boolean;
  hideLocationInput?: boolean;
  radiusKm: string;
  setRadiusKm: (val: string) => void;
  includeCompleted: boolean;
  setIncludeCompleted: (val: boolean) => void;


}

export default function FiltersBar({
  priceRange,
  setPriceRange,
  location,
  setLocation,
  duration,
  setDuration,
  filterRequests,
  setFilterRequests,
  filterMine,
  setFilterMine,
  nearby,
  setNearby,
  resetTrigger,
  hideLocationInput = false,
  radiusKm,
  setRadiusKm,
  includeCompleted,
  setIncludeCompleted,
}: FiltersBarProps) {
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { userCity } = React.useContext(UserContext);

  useEffect(() => {
    setDays('');
    setHours('');
    setMinutes('');
  }, [resetTrigger]);

  useEffect(() => {
    if (days === '' && hours === '' && minutes === '') {
      setDuration('');
    } else {
      const durString = `P${days || 0}DT${hours || 0}H${minutes || 0}M`;
      setDuration(durString);
    }
  }, [days, hours, minutes]);


  useEffect(() => {
    if (nearby) {
      setShowDropdown(false);
    }
  }, [nearby]);
  

  const filteredCities = locationQuery
    ? cities.filter(c => c.toLowerCase().startsWith(locationQuery.toLowerCase()))
    : [];

  return (
    <View style={styles.card}>
      <Text style={styles.label}>💰 Price Range: {priceRange[0]}₪ - {priceRange[1]}₪</Text>
      <MultiSlider
        values={priceRange}
        min={0}
        max={1000}
        step={20}
        sliderLength={340}
        onValuesChange={(values) => setPriceRange([values[0], values[1]])}
        selectedStyle={{ backgroundColor: '#007AFF' }}
        markerStyle={{ height: 24, width: 24 }}
        containerStyle={{ alignSelf: 'center', marginVertical: 12 }}
      />

      {!hideLocationInput && (
        <>
          <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>📍 Specific Location</Text>
            <TextInput
              placeholder="Enter a city name"
              placeholderTextColor="#666"


              value={locationQuery}
              onChangeText={(text) => {
                setLocationQuery(text);
                setLocation(''); 
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}

              
              editable={!nearby}
              style={[styles.input, nearby && { opacity: 0.5 }]}
            />
          </View>

          {(!hideLocationInput && !radiusKm) && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setNearby(!nearby)}
          >
            <Ionicons
              name={nearby ? 'checkbox' : 'square-outline'}
              size={24}
              color={nearby ? '#007AFF' : '#aaa'}
            />
            <Text style={styles.checkboxLabel}>Nearby</Text>
          </TouchableOpacity>
          )}



        </View>



          {showDropdown && filteredCities.length > 0 && (
            <View style={styles.dropdown}>
              {filteredCities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setLocation(city);
                    setLocationQuery(city);
                    setShowDropdown(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.dropdownItem}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {hideLocationInput && (
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.label}>📏 Radius Filter (km)</Text>
          <TextInput
            placeholder="Enter radius in km (e.g. 10)"
            placeholderTextColor="#555"
            value={radiusKm}
            onChangeText={setRadiusKm}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      )}



      <Text style={styles.label}>⏳ Duration</Text>
      <View style={styles.durationRow}>
        <TextInput
          placeholder="Days"
          value={days}
          onChangeText={setDays}
          keyboardType="numeric"
          placeholderTextColor="#555"
          style={styles.durationInput}
        />
        <TextInput
          placeholder="Hours"
          value={hours}
          onChangeText={setHours}
          keyboardType="numeric"
          placeholderTextColor="#555"
          style={styles.durationInput}
        />
        <TextInput
          placeholder="Minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="numeric"
          placeholderTextColor="#555"
          style={styles.durationInput}
        />
      </View>

      <View style={styles.toggleGroup}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleText}>{filterRequests ? '📝 Requests' : '🎯 Offers'}</Text>
          <Switch value={filterRequests} onValueChange={setFilterRequests} />
        </View>

        <View style={styles.toggleItem}>
          <Text style={styles.toggleText}>{filterMine ? '👤 Mine' : ' 🌍 Others'}</Text>
          <Switch value={filterMine} onValueChange={setFilterMine} />
        </View>

     
      </View>

      <View style={styles.checkboxRow}>
      <TouchableOpacity
        onPress={() => setIncludeCompleted(!includeCompleted)}
        style={styles.checkboxContainer}
      >
        <Ionicons
          name={includeCompleted ? 'checkbox' : 'square-outline'}
          size={24}
          color={includeCompleted ? '#28a745' : '#aaa'}
        />
        <Text style={styles.checkboxLabel}>Include Completed Services</Text>
      </TouchableOpacity>
    </View>


    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 48,   
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: -6,
    marginBottom: 8,
    zIndex: 99,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  durationInput: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
  },


  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,

  },
  

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48, 
    paddingHorizontal: 8,
    marginLeft: 10,
  },

  nearToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  

  
  checkboxLabel: {
    marginLeft: 6,
    fontSize: 14,
  },

  checkboxRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  
  
  
  
});
