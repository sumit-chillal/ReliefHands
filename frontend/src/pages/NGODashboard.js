import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Plus,
  LogOut,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Upload,
  AlertTriangle,
  History,
  Home,
  Map as MapIcon,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NGODashboard = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaigns");

  // Create campaign form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [volunteersNeeded, setVolunteersNeeded] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getToken();
    try {
      const [campaignsRes, requestsRes, pastCampaignsRes] = await Promise.all([
        axios.get(`${API}/ngo/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/ngo/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/ngo/past-campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCampaigns(campaignsRes.data);
      setRequests(requestsRes.data);
      setPastCampaigns(pastCampaignsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const token = getToken();
    setLoading(true);
    try {
      await axios.post(
        `${API}/ngo/campaigns`,
        {
          title,
          description,
          location,
          startDate,
          endDate,
          volunteersNeeded: parseInt(volunteersNeeded),
          isEmergency,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        isEmergency
          ? "Emergency campaign created! Awaiting admin approval for emergency status."
          : "Campaign created successfully"
      );
      setShowCreateCampaign(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedCampaign || uploadFiles.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    const token = getToken();
    const formData = new FormData();
    uploadFiles.forEach((file) => {
      formData.append("files", file);
    });

    setLoading(true);
    try {
      await axios.post(
        `${API}/ngo/campaigns/${selectedCampaign.id}/upload-images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Images uploaded successfully");
      setShowImageUpload(false);
      setUploadFiles([]);
      setSelectedCampaign(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    const token = getToken();
    try {
      await axios.put(
        `${API}/ngo/requests/${requestId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Request ${status.toLowerCase()}`);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleCompleteCampaign = async (campaignId) => {
    const token = getToken();
    try {
      await axios.put(
        `${API}/ngo/campaigns/${campaignId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Campaign completed and certificates generated");
      fetchData();
    } catch (error) {
      toast.error("Failed to complete campaign");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setVolunteersNeeded("");
    setIsEmergency(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading && campaigns.length === 0) {
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
            <h1 className="text-2xl font-bold" data-testid="ngo-dashboard">
              NGO Dashboard
            </h1>
            <p className="text-sm text-gray-600">{user?.ngoName}</p>
            {user?.status === "Pending" && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠ Awaiting admin approval
              </p>
            )}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
              <TabsTrigger value="past">
                <History className="w-4 h-4 mr-2" />
                Past Works
              </TabsTrigger>
              <TabsTrigger value="requests">Volunteer Requests</TabsTrigger>
            </TabsList>
            
            {user?.status === "Approved" && activeTab === "campaigns" && (
              <Button
                onClick={() => setShowCreateCampaign(true)}
                className="btn-volunteer"
                data-testid="create-campaign-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Campaign
              </Button>
            )}
          </div>

          <TabsContent value="campaigns" className="space-y-6">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No campaigns yet. Create your first campaign!
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns
                  .sort((a, b) => {
                    // Sort emergency campaigns first
                    if (a.isEmergency && a.emergencyApproved && !(b.isEmergency && b.emergencyApproved)) return -1;
                    if (!(a.isEmergency && a.emergencyApproved) && b.isEmergency && b.emergencyApproved) return 1;
                    return 0;
                  })
                  .map((campaign) => (
                    <Card
                      key={campaign.id}
                      className={`campaign-card ${
                        campaign.isEmergency && campaign.emergencyApproved
                          ? "border-4 border-red-500 shadow-lg animate-pulse"
                          : campaign.isEmergency
                          ? "border-2 border-orange-400"
                          : ""
                      }`}
                      data-testid={`campaign-${campaign.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg flex-1">{campaign.title}</CardTitle>
                          {campaign.isEmergency && campaign.emergencyApproved && (
                            <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              EMERGENCY
                            </span>
                          )}
                          {campaign.isEmergency && !campaign.emergencyApproved && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded inline-block mt-2 ${
                            campaign.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {campaign.status}
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
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {campaign.location}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(campaign.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-600">
                            Volunteers needed: {campaign.volunteersNeeded}
                          </div>
                          {campaign.galleryImages && campaign.galleryImages.length > 0 && (
                            <div className="text-gray-600 text-xs">
                              {campaign.galleryImages.length} image(s) uploaded
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <Button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowImageUpload(true);
                            }}
                            className="w-full"
                            variant="outline"
                            size="sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Images
                          </Button>
                          
                          {campaign.status === "Active" && (
                            <Button
                              onClick={() => handleCompleteCampaign(campaign.id)}
                              className="w-full"
                              variant="outline"
                              size="sm"
                              data-testid={`complete-campaign-${campaign.id}`}
                            >
                              Mark as Completed
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

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
                      <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {campaign.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">

        {/* Volunteer Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No volunteer requests yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Volunteer</th>
                      <th className="text-left py-3 px-4">Campaign</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Applied</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b"
                        data-testid={`request-${req.id}`}
                      >
                        <td className="py-3 px-4">{req.volunteerName}</td>
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
                        <td className="py-3 px-4">
                          {req.status === "Pending" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleRequestAction(req.id, "Approved")
                                }
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`approve-request-${req.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleRequestAction(req.id, "Rejected")
                                }
                                data-testid={`reject-request-${req.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
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
        </Tabs>
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent
          className="sm:max-w-lg"
          data-testid="create-campaign-modal"
        >
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="campaign-title-input"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                data-testid="campaign-description-input"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                data-testid="campaign-location-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  data-testid="campaign-start-date-input"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  data-testid="campaign-end-date-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="volunteersNeeded">Volunteers Needed *</Label>
              <Input
                id="volunteersNeeded"
                type="number"
                value={volunteersNeeded}
                onChange={(e) => setVolunteersNeeded(e.target.value)}
                required
                min="1"
                data-testid="campaign-volunteers-input"
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Checkbox
                id="isEmergency"
                checked={isEmergency}
                onCheckedChange={setIsEmergency}
                data-testid="campaign-emergency-checkbox"
              />
              <div>
                <Label htmlFor="isEmergency" className="font-semibold text-red-700 cursor-pointer">
                  Mark as Emergency Campaign
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Emergency campaigns require admin approval and will be highlighted prominently
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-volunteer"
              disabled={loading}
              data-testid="submit-campaign-btn"
            >
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Upload Modal */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Campaign Images</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Selected Campaign</Label>
              <p className="text-sm text-gray-600 mt-1">
                {selectedCampaign?.title}
              </p>
            </div>

            <div>
              <Label htmlFor="campaign-images">Select Images</Label>
              <Input
                id="campaign-images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can select multiple images. First image will be set as featured image.
              </p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="text-sm text-gray-600">
                {uploadFiles.length} file(s) selected
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImageUpload}
                className="flex-1 btn-volunteer"
                disabled={loading || uploadFiles.length === 0}
              >
                {loading ? "Uploading..." : "Upload Images"}
              </Button>
              <Button
                onClick={() => {
                  setShowImageUpload(false);
                  setUploadFiles([]);
                  setSelectedCampaign(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NGODashboard;
