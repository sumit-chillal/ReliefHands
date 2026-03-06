import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MapPin, Navigation, Phone, Mail, ArrowLeft, Heart } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GOOGLE_MAPS_API_KEY = "AIzaSyBt5bDGaE1cKcIaVLz9iRq9A7j5h5DxYkM"; // You'll need to add this to .env

const MapsPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(userLoc);

            // Load Google Maps using new API
            const loader = new Loader({
              apiKey: GOOGLE_MAPS_API_KEY,
              version: "weekly",
            });

            await loader.load();
            
            const mapInstance = new window.google.maps.Map(mapRef.current, {
              center: userLoc,
              zoom: 12,
            });

            setMap(mapInstance);

            // Add user location marker
            new window.google.maps.Marker({
              map: mapInstance,
              position: userLoc,
              title: "Your Location",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              },
            });

            // Fetch nearby NGOs
            fetchNearbyNGOs(userLoc.lat, userLoc.lng, mapInstance);
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error("Unable to get your location. Showing default location.");
            loadDefaultMap();
          }
        );
      } else {
        loadDefaultMap();
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setLoading(false);
    }
  };

  const loadDefaultMap = async () => {
    const defaultLoc = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    setUserLocation(defaultLoc);

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });

    await loader.load();

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultLoc,
      zoom: 10,
    });

    setMap(mapInstance);
    fetchNearbyNGOs(defaultLoc.lat, defaultLoc.lng, mapInstance);
  };

  const fetchNearbyNGOs = async (lat, lng, mapInstance) => {
    try {
      const response = await axios.get(`${API}/maps/nearby-ngos`, {
        params: { latitude: lat, longitude: lng, radius_km: 50 },
      });

      setNgos(response.data);
      addNgoMarkers(response.data, mapInstance);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast.error("Failed to load nearby NGOs");
      setLoading(false);
    }
  };

  const addNgoMarkers = async (ngoList, mapInstance) => {
    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers = ngoList.map((ngo) => {
      const marker = new window.google.maps.Marker({
        map: mapInstance,
        position: { lat: ngo.latitude, lng: ngo.longitude },
        title: ngo.ngoName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#FCD34D",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedNgo(ngo);
        mapInstance.panTo({ lat: ngo.latitude, lng: ngo.longitude });
        mapInstance.setZoom(14);
      });

      return marker;
    });

    setMarkers(newMarkers);
  };

  const getDirections = async (ngo) => {
    if (!userLocation) {
      toast.error("Your location is not available");
      return;
    }

    try {
      const response = await axios.get(`${API}/maps/directions`, {
        params: {
          start_lat: userLocation.lat,
          start_lng: userLocation.lng,
          end_lat: ngo.latitude,
          end_lng: ngo.longitude,
        },
      });

      // Open Google Maps with directions
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${ngo.latitude},${ngo.longitude}&travelmode=driving`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error getting directions:", error);
      // Fallback to Google Maps URL
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${ngo.latitude},${ngo.longitude}&travelmode=driving`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Find Nearby NGOs</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* NGO List */}
          <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 sticky top-0 bg-gray-50 pb-2">
              Nearby NGOs ({ngos.length})
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading nearby NGOs...</p>
              </div>
            ) : ngos.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No NGOs found in your area</p>
                </CardContent>
              </Card>
            ) : (
              ngos.map((ngo) => (
                <Card
                  key={ngo.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedNgo?.id === ngo.id ? "border-2 border-yellow-500" : ""
                  }`}
                  onClick={() => {
                    setSelectedNgo(ngo);
                    map?.panTo({ lat: ngo.latitude, lng: ngo.longitude });
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <span>{ngo.ngoName}</span>
                      <span className="text-sm font-normal text-gray-600">
                        {ngo.distance} km
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{ngo.address}</span>
                    </div>
                    {ngo.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{ngo.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>{ngo.email}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {ngo.mission}
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(ngo);
                      }}
                      className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600"
                      size="sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div
                ref={mapRef}
                className="w-full h-[calc(100vh-200px)]"
                style={{ minHeight: "500px" }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapsPage;
