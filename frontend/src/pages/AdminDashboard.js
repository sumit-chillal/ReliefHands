import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
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
  Users,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  LogOut,
  AlertTriangle,
  Home,
  Map as MapIcon,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getToken();
    try {
      const [analyticsRes, volunteersRes, ngosRes, campaignsRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/admin/volunteers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/admin/ngos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/admin/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAnalytics(analyticsRes.data);
      setVolunteers(volunteersRes.data);
      setNgos(ngosRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyApproval = async (campaignId, approve) => {
    const token = getToken();
    try {
      await axios.put(
        `${API}/admin/campaigns/${campaignId}/approve-emergency`,
        { emergencyApproved: approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Emergency status ${approve ? "approved" : "rejected"}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update emergency status");
    }
  };

  const handleVerifyVolunteer = async (volunteerId, status) => {
    const token = getToken();
    try {
      await axios.put(
        `${API}/admin/verify-volunteer/${volunteerId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Volunteer ${status.toLowerCase()}`);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleVerifyNGO = async (ngoId, status) => {
    const token = getToken();
    try {
      await axios.put(
        `${API}/admin/verify-ngo/${ngoId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`NGO ${status.toLowerCase()}`);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
          <h1 className="text-2xl font-bold" data-testid="admin-dashboard">
            Admin Dashboard
          </h1>
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
        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Volunteers
              </CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.totalVolunteers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total NGOs</CardTitle>
              <Building2 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.totalNGOs || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Campaigns
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.totalCampaigns || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Campaigns
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.activeCampaigns || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Campaigns Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Emergency Campaigns Requiring Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.filter(c => c.isEmergency && !c.emergencyApproved).length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No pending emergency campaigns
              </p>
            ) : (
              <div className="space-y-4">
                {campaigns.filter(c => c.isEmergency && !c.emergencyApproved).map((campaign) => (
                  <div key={campaign.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{campaign.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{campaign.ngoName}</p>
                        <p className="text-sm text-gray-700 mt-2">{campaign.description}</p>
                        <div className="text-xs text-gray-600 mt-2">
                          Location: {campaign.location} | Volunteers Needed: {campaign.volunteersNeeded}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleEmergencyApproval(campaign.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEmergencyApproval(campaign.id, false)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volunteers Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((vol) => (
                    <tr
                      key={vol.id}
                      className="border-b"
                      data-testid={`volunteer-row-${vol.id}`}
                    >
                      <td className="py-3 px-4">{vol.name}</td>
                      <td className="py-3 px-4">{vol.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            vol.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {vol.verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {!vol.verified && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleVerifyVolunteer(vol.id, "Approved")
                              }
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`approve-volunteer-${vol.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleVerifyVolunteer(vol.id, "Rejected")
                              }
                              data-testid={`reject-volunteer-${vol.id}`}
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
          </CardContent>
        </Card>

        {/* NGOs Table */}
        <Card>
          <CardHeader>
            <CardTitle>NGOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">NGO Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Registration ID</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ngos.map((ngo) => (
                    <tr
                      key={ngo.id}
                      className="border-b"
                      data-testid={`ngo-row-${ngo.id}`}
                    >
                      <td className="py-3 px-4">{ngo.ngoName}</td>
                      <td className="py-3 px-4">{ngo.email}</td>
                      <td className="py-3 px-4">{ngo.registrationId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            ngo.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : ngo.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ngo.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {ngo.status === "Pending" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleVerifyNGO(ngo.id, "Approved")
                              }
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`approve-ngo-${ngo.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleVerifyNGO(ngo.id, "Rejected")
                              }
                              data-testid={`reject-ngo-${ngo.id}`}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
