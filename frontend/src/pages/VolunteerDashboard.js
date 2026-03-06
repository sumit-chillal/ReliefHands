import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  LogOut,
  MapPin,
  Calendar,
  Users,
  Download,
  CheckCircle,
  AlertTriangle,
  History,
  Home,
  Map as MapIcon,
  Filter,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VolunteerDashboard = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterEmergency, setFilterEmergency] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getToken();
    try {
      const params = {};
      if (filterLocation) params.location = filterLocation;
      if (filterEmergency === "emergency") params.emergency_only = true;

      const [campaignsRes, requestsRes, certificatesRes, pastCampaignsRes] = await Promise.all([
        axios.get(`${API}/volunteer/campaigns`, { params }),
        axios.get(`${API}/volunteer/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/volunteer/certificates`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/volunteer/past-campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCampaigns(campaignsRes.data);
      setMyRequests(requestsRes.data);
      setCertificates(certificatesRes.data);
      setPastCampaigns(pastCampaignsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterLocation, filterEmergency]);

  const handleApply = async (campaignId) => {
    const token = getToken();
    try {
      await axios.post(
        `${API}/volunteer/requests`,
        { campaignId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Application submitted successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to apply");
    }
  };

  const handleDownloadCertificate = async (certificateId, volunteerName) => {
    const token = getToken();
    try {
      const response = await axios.get(
        `${API}/volunteer/certificates/${certificateId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${volunteerName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Certificate downloaded");
    } catch (error) {
      toast.error("Failed to download certificate");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const hasApplied = (campaignId) => {
    return myRequests.some((req) => req.campaignId === campaignId);
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
          <div>
            <h1
              className="text-2xl font-bold"
              data-testid="volunteer-dashboard"
            >
              Volunteer Dashboard
            </h1>
            <p className="text-sm text-gray-600">Welcome, {user?.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link to="/ngo-list" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">NGO List</span>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="campaigns">
          <TabsList className="mb-6">
            <TabsTrigger value="campaigns" data-testid="campaigns-tab">
              Available Campaigns
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="past-campaigns-tab">
              <History className="w-4 h-4 mr-2" />
              Past Works
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="my-requests-tab">
              My Applications
            </TabsTrigger>
            <TabsTrigger value="certificates" data-testid="certificates-tab">
              Certificates
            </TabsTrigger>
          </TabsList>

          {/* Available Campaigns */}
          <TabsContent value="campaigns">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <Label className="font-semibold">Filters:</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="location-filter" className="text-sm">Location:</Label>
                    <Input
                      id="location-filter"
                      placeholder="Enter city..."
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="emergency-filter" className="text-sm">Show:</Label>
                    <Select value={filterEmergency} onValueChange={setFilterEmergency}>
                      <SelectTrigger className="w-40" id="emergency-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Campaigns</SelectItem>
                        <SelectItem value="emergency">Emergency Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(filterLocation || filterEmergency !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterLocation("");
                        setFilterEmergency("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No campaigns found matching your filters
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className={`campaign-card ${
                      campaign.isEmergency && campaign.emergencyApproved
                        ? "border-4 border-red-500 shadow-lg animate-pulse"
                        : ""
                    }`}
                    data-testid={`campaign-${campaign.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg flex-1">
                          {campaign.title}
                        </CardTitle>
                        {campaign.isEmergency && campaign.emergencyApproved && (
                          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {campaign.ngoName}
                      </p>
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

                      {hasApplied(campaign.id) ? (
                        <Button className="w-full" variant="outline" disabled>
                          <CheckCircle className="w-4 h-4 mr-2" /> Applied
                        </Button>
                      ) : (
                        <Button
                          className="w-full btn-volunteer"
                          onClick={() => handleApply(campaign.id)}
                          data-testid={`apply-${campaign.id}`}
                        >
                          Apply Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Applications */}
          <TabsContent value="requests">
            <Card>
              <CardContent className="p-6">
                {myRequests.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No applications yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Campaign</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Applied On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myRequests.map((req) => (
                          <tr
                            key={req.id}
                            className="border-b"
                            data-testid={`request-${req.id}`}
                          >
                            <td className="py-3 px-4">{req.campaignTitle}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  req.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : req.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {new Date(req.appliedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <p className="text-sm text-gray-600">{campaign.ngoName}</p>
                    </CardHeader>
                    <CardContent>
                      {campaign.featuredImage && (
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${campaign.featuredImage}`}
                          alt={campaign.title}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <p className="text-sm text-gray-700 mb-4">{campaign.description}</p>
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

          {/* Certificates */}
          <TabsContent value="certificates">
            {certificates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No certificates yet. Complete campaigns to earn certificates!
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <Card
                    key={cert.id}
                    className="campaign-card"
                    data-testid={`certificate-${cert.id}`}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {cert.campaignTitle}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{cert.ngoName}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Completed on{" "}
                        {new Date(cert.completionDate).toLocaleDateString()}
                      </p>
                      <Button
                        className="w-full btn-volunteer"
                        onClick={() =>
                          handleDownloadCertificate(cert.id, cert.volunteerName)
                        }
                        data-testid={`download-${cert.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" /> Download
                        Certificate
                      </Button>
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

export default VolunteerDashboard;
