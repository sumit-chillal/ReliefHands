import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import image from '../logo/logoR.jpg'
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Users,
  Heart,
  AlertTriangle,
  History,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NGOListPage = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [ngos, setNgos] = useState([]);
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNGOs();
  }, []);

  useEffect(() => {
    filterNGOs();
  }, [searchTerm, locationFilter, ngos]);

  const fetchNGOs = async () => {
    try {
      const response = await axios.get(`${API}/volunteer/ngos`);
      setNgos(response.data);
      setFilteredNgos(response.data);
    } catch (error) {
      toast.error("Failed to load NGOs");
    } finally {
      setLoading(false);
    }
  };

  const filterNGOs = () => {
    let filtered = ngos;

    if (searchTerm) {
      filtered = filtered.filter(
        (ngo) =>
          ngo.ngoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ngo.mission.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter((ngo) =>
        ngo.address?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredNgos(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

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
              Back to Home
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <img src={image} alt="Logo"  className="w-10 h-10 rounded-full object-cover"/>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Registered NGOs
                </h1>
                <p className="text-xs text-gray-600">
                  {filteredNgos.length} NGO{filteredNgos.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search NGOs by name or mission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <Label className="text-sm">Location:</Label>
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-48"
                />
              </div>

              {(searchTerm || locationFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setLocationFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NGO List */}
        {filteredNgos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No NGOs found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNgos.map((ngo) => (
              <Card
                key={ngo.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/ngo-details/${ngo.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-yellow-600" />
                        {ngo.ngoName}
                      </CardTitle>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 inline-block mt-2">
                        Verified
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {ngo.mission}
                  </p>

                  {ngo.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{ngo.address}</span>
                    </div>
                  )}

                  {ngo.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{ngo.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{ngo.email}</span>
                  </div>

                  <Button
                    className="w-full mt-4 btn-volunteer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/ngo-details/${ngo.id}`);
                    }}
                  >
                    View Details & Campaigns
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// NGO Detail Page Component
export const NGODetailPage = () => {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [ngo, setNgo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNGODetails();
  }, [ngoId]);

  const fetchNGODetails = async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch NGO details
      const ngosResponse = await axios.get(`${API}/volunteer/ngos`);
      const ngoData = ngosResponse.data.find((n) => n.id === ngoId);
      setNgo(ngoData);

      // Fetch all campaigns for this NGO
      const campaignsResponse = await axios.get(`${API}/volunteer/campaigns`, {
        params: { ngo_id: ngoId },
      });
      
      const allCampaigns = campaignsResponse.data;
      setCampaigns(allCampaigns.filter((c) => c.status === "Active"));
      setPastCampaigns(allCampaigns.filter((c) => c.status === "Completed"));
    } catch (error) {
      toast.error("Failed to load NGO details");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCampaign = async (campaignId) => {
    if (!user) {
      toast.error("Please login to apply for campaigns");
      navigate("/");
      return;
    }

    const token = getToken();
    try {
      await axios.post(
        `${API}/volunteer/requests`,
        { campaignId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Application submitted successfully!");
      fetchNGODetails(); // Refresh to update applied status
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to submit application"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">NGO not found</p>
            <Button onClick={() => navigate("/ngo-list")}>
              Back to NGO List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/ngo-list")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to NGO List
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{ngo.ngoName}</h1>
              <p className="text-gray-600 mt-2">{ngo.mission}</p>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {ngo.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{ngo.address}</span>
                  </div>
                )}
                {ngo.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{ngo.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{ngo.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Active Campaigns ({campaigns.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              <History className="w-4 h-4 mr-2" />
              Past Works ({pastCampaigns.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Campaigns */}
          <TabsContent value="active">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No active campaigns at the moment
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className={`${
                      campaign.isEmergency && campaign.emergencyApproved
                        ? "border-4 border-red-500 shadow-lg animate-pulse"
                        : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg flex-1">
                          {campaign.title}
                        </CardTitle>
                        {campaign.isEmergency && campaign.emergencyApproved && (
                          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            EMERGENCY
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {campaign.featuredImage && (
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${campaign.featuredImage}`}
                          alt={campaign.title}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {campaign.location}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          {campaign.volunteersNeeded} volunteers needed
                        </div>
                      </div>

                      {user && user.role === "volunteer" && (
                        <Button
                          onClick={() => handleApplyToCampaign(campaign.id)}
                          className="w-full btn-volunteer"
                        >
                          Apply to Campaign
                        </Button>
                      )}
                      {!user && (
                        <Button
                          onClick={() => navigate("/")}
                          className="w-full btn-volunteer"
                        >
                          Login to Apply
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Past Works */}
          <TabsContent value="past">
            {pastCampaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No completed campaigns yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="opacity-80">
                    <CardHeader>
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 inline-block">
                        Completed
                      </span>
                    </CardHeader>
                    <CardContent>
                      {campaign.featuredImage && (
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${campaign.featuredImage}`}
                          alt={campaign.title}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <p className="text-sm text-gray-700 mb-4">
                        {campaign.description}
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {campaign.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Completed: {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NGOListPage;
