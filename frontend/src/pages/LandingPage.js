import React, { useState } from "react";
import image from '../logo/logoR.jpg'
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Users,
  Heart,
  Award,
  MapPin,
  TrendingUp,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Map,
  Building2,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, login, registerVolunteer, registerNGO, googleAuth, accountType } =
    useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Volunteer registration
  const [volName, setVolName] = useState("");
  const [volEmail, setVolEmail] = useState("");
  const [volPassword, setVolPassword] = useState("");

  // NGO registration
  const [ngoName, setNgoName] = useState("");
  const [ngoRegId, setNgoRegId] = useState("");
  const [ngoEmail, setNgoEmail] = useState("");
  const [ngoPassword, setNgoPassword] = useState("");
  const [ngoMission, setNgoMission] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      toast.success("Login successful!");
      setShowAuth(false);

      if (data.accountType === "ngo") {
        navigate("/ngo");
      } else if (data.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/volunteer");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerVolunteer(volName, volEmail, volPassword);
      toast.success("Registration successful!");
      setShowAuth(false);
      navigate("/volunteer");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNGORegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerNGO({
        ngoName,
        registrationId: ngoRegId,
        email: ngoEmail,
        password: ngoPassword,
        mission: ngoMission,
      });
      toast.success("NGO registration successful! Awaiting admin approval.");
      setShowAuth(false);
      navigate("/ngo");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const data = await googleAuth(credentialResponse.credential);
      toast.success("Login successful!");
      setShowAuth(false);
      
      if (data.accountType === "ngo") {
        navigate("/ngo");
      } else if (data.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/volunteer");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed");
  };

  // Don't redirect if already logged in - allow viewing landing page
  // Users can navigate to dashboard from header button

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <img src={image} alt="Logo"  className="w-10 h-10 rounded-full object-cover"/>
              </div>
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Space Grotesk" }}
              >
                RELIEF HANDS
              </h1>
              <p className="text-xs text-gray-600">Empowering Communities</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/ngo-list" className="flex items-center gap-2 text-gray-700 hover:text-yellow-600 font-medium">
              <Building2 className="w-5 h-5" />
              <span className="hidden sm:inline">NGO List</span>
            </Link>
            
            {user ? (
              <Button
                onClick={() => {
                  if (accountType === "ngo") {
                    navigate("/ngo");
                  } else if (user.role === "admin") {
                    navigate("/admin");
                  } else {
                    navigate("/volunteer");
                  }
                }}
                className="btn-volunteer"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => setShowAuth(true)}
                className="btn-volunteer"
                data-testid="volunteer-now-btn"
              >
                Volunteer Now
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative hero-watercolor bg-gradient-to-br from-[#FFFEF9] via-white to-[#FFF8E7] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 relative z-10">
              <h2 className="hero-heading text-4xl sm:text-5xl lg:text-6xl leading-tight">
                Join us to <span className="text-yellow-500">empower</span>{" "}
                <span className="text-green-600">communities</span> and make an
                impact
              </h2>
              <p className="text-base sm:text-lg text-gray-700">
                Connect with verified NGOs, participate in meaningful
                volunteering campaigns, and earn certificates for your
                contributions to society.
              </p>
              <Button
                onClick={() => setShowAuth(true)}
                size="lg"
                className="btn-volunteer text-lg px-8 py-6"
                data-testid="get-started-btn"
              >
                Get Started Today
              </Button>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop"
                alt="Volunteers helping community"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-400/30 to-transparent blur-3xl"></div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                What <span className="text-yellow-500">we</span> do
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    Why Join Relief Hands?
                  </h3>
                  <p className="text-gray-700">
                    Relief Hands is a comprehensive volunteering platform dedicated to connecting passionate individuals with verified NGOs and local communities across state. Since our inception, we have facilitated countless meaningful volunteer experiences, empowering people to create lasting, positive change where it matters most.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    How you can make a difference?
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">✓</span>
                      <span>
                        <strong>Support education:</strong> Help underprivileged
                        children access quality education and learning resources
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">✓</span>
                      <span>
                        <strong>Community development:</strong> Participate in
                        initiatives that empower local communities
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">✓</span>
                      <span>
                        <strong>Environmental conservation:</strong> Join
                        campaigns focused on sustainability and conservation
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">✓</span>
                      <span>
                        <strong>Healthcare support:</strong> Assist in health
                        awareness and medical aid programs
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="font-semibold text-gray-900">
                    Earn Recognition
                  </p>
                  <p className="text-gray-700 text-sm mt-1">
                    Receive verified certificates for completed campaigns that
                    you can showcase on your resume and professional profiles.
                  </p>
                </div>
              </div>
            </div>

            {/* Volunteer Registration Form */}
            <Card className="shadow-xl border-2 border-yellow-400">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Start Your Journey
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowAuth(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      className="mt-1"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-volunteer"
                    data-testid="continue-registration-btn"
                  >
                    Continue to Registration
                  </Button>

                  <p className="text-xs text-center text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setShowAuth(true)}
                      className="text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 yellow-brush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            Our <span className="text-white">Impact</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div
              className="impact-card text-center"
              data-testid="impact-volunteers"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">12,450+</h3>
              <p className="text-gray-700 font-medium">Active Volunteers</p>
              <p className="text-sm text-gray-600 mt-2">
                Making a difference across 150+ campaigns nationwide
              </p>
            </div>

            <div className="impact-card text-center" data-testid="impact-ngos">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">85+</h3>
              <p className="text-gray-700 font-medium">Verified NGOs</p>
              <p className="text-sm text-gray-600 mt-2">
                Trusted organizations creating social impact
              </p>
            </div>

            <div
              className="impact-card text-center"
              data-testid="impact-campaigns"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">200+</h3>
              <p className="text-gray-700 font-medium">Successful Campaigns</p>
              <p className="text-sm text-gray-600 mt-2">
                Completed projects with measurable community impact
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Presence Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Our <span className="text-yellow-500">Presence</span>
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop"
                alt="Volunteers working together across communities"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Nationwide Coverage
                  </h3>
                  <p className="text-gray-700 text-lg">
                    We currently work with <strong>85 verified NGOs</strong>{" "}
                    across <strong>18 states</strong> in India.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <TrendingUp className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Growing Network</h3>
                  <p className="text-gray-700 text-lg">
                    Our platform is rapidly expanding, with new NGOs and
                    campaigns added weekly.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-gray-700 italic">
                  "Relief Hands has made it incredibly easy to find meaningful
                  volunteer opportunities. The certificate I earned has been a
                  great addition to my resume!"
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  — Priya S., Active Volunteer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-10">
            AWARDS & RECOGNITION
          </h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="font-bold mb-2">Social Impact Award</h3>
              <p className="text-sm text-gray-400">
                Recognized for community impact
              </p>
            </div>

            <div>
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="font-bold mb-2">Best Platform 2024</h3>
              <p className="text-sm text-gray-400">
                Leading volunteering platform
              </p>
            </div>

            <div>
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="font-bold mb-2">Trust & Transparency</h3>
              <p className="text-sm text-gray-400">Verified NGO partnerships</p>
            </div>

            <div>
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="font-bold mb-2">Innovation Award</h3>
              <p className="text-sm text-gray-400">Tech-driven social change</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              Subscribe to Our Newsletter
            </h3>
            <form className="max-w-md mx-auto flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button type="submit" className="btn-volunteer">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Our Mission
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Impact Stories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Get Involved</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Volunteer
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Register NGO
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Campaigns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <Facebook className="w-5 h-5 cursor-pointer hover:text-yellow-400" />
                <Twitter className="w-5 h-5 cursor-pointer hover:text-yellow-400" />
                <Instagram className="w-5 h-5 cursor-pointer hover:text-yellow-400" />
                <Linkedin className="w-5 h-5 cursor-pointer hover:text-yellow-400" />
                <Youtube className="w-5 h-5 cursor-pointer hover:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>
              © 2025 Relief Hands. All rights reserved. | Empowering Communities
              Through Volunteering
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md" data-testid="auth-modal">
          <DialogHeader>
            <DialogTitle>Join Relief Hands</DialogTitle>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={setAuthTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" data-testid="login-tab">
                Login
              </TabsTrigger>
              <TabsTrigger value="volunteer" data-testid="volunteer-tab">
                Volunteer
              </TabsTrigger>
              <TabsTrigger value="ngo" data-testid="ngo-tab">
                NGO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    data-testid="login-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    data-testid="login-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-volunteer"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    width="300"
                  />
                </div>
              </form>
            </TabsContent>

            <TabsContent value="volunteer">
              <form onSubmit={handleVolunteerRegister} className="space-y-4">
                <div>
                  <Label htmlFor="vol-name">Full Name</Label>
                  <Input
                    id="vol-name"
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    required
                    data-testid="volunteer-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="vol-email">Email</Label>
                  <Input
                    id="vol-email"
                    type="email"
                    value={volEmail}
                    onChange={(e) => setVolEmail(e.target.value)}
                    required
                    data-testid="volunteer-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="vol-password">Password</Label>
                  <Input
                    id="vol-password"
                    type="password"
                    value={volPassword}
                    onChange={(e) => setVolPassword(e.target.value)}
                    required
                    data-testid="volunteer-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-volunteer"
                  disabled={loading}
                  data-testid="volunteer-register-btn"
                >
                  {loading ? "Registering..." : "Register as Volunteer"}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    width="300"
                  />
                </div>
              </form>
            </TabsContent>

            <TabsContent value="ngo">
              <form onSubmit={handleNGORegister} className="space-y-4">
                <div>
                  <Label htmlFor="ngo-name">NGO Name</Label>
                  <Input
                    id="ngo-name"
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    required
                    data-testid="ngo-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="ngo-reg">Registration ID</Label>
                  <Input
                    id="ngo-reg"
                    value={ngoRegId}
                    onChange={(e) => setNgoRegId(e.target.value)}
                    required
                    data-testid="ngo-regid-input"
                  />
                </div>
                <div>
                  <Label htmlFor="ngo-email">Email</Label>
                  <Input
                    id="ngo-email"
                    type="email"
                    value={ngoEmail}
                    onChange={(e) => setNgoEmail(e.target.value)}
                    required
                    data-testid="ngo-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="ngo-password">Password</Label>
                  <Input
                    id="ngo-password"
                    type="password"
                    value={ngoPassword}
                    onChange={(e) => setNgoPassword(e.target.value)}
                    required
                    data-testid="ngo-password-input"
                  />
                </div>
                <div>
                  <Label htmlFor="ngo-mission">Mission Statement</Label>
                  <Input
                    id="ngo-mission"
                    value={ngoMission}
                    onChange={(e) => setNgoMission(e.target.value)}
                    required
                    data-testid="ngo-mission-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-volunteer"
                  disabled={loading}
                  data-testid="ngo-register-btn"
                >
                  {loading ? "Registering..." : "Register NGO"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
