import { useAuth } from '../utils/useAuth';
import { useNavigate } from 'react-router-dom';
import { Truck, Navigation, Activity, Map as MapIcon, LogOut, TrendingUp, TrendingDown, Zap, Battery, Home, BarChart3, FileText, ChevronRight, User as UserIcon, Thermometer, MapPin, AlertTriangle, Layers } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../config/firebase.config';
import logoSvg from '../assets/images/u4-logo.svg';

const Sidebar = ({ activeMenuItem, setActiveMenuItem, scrollTo }: { activeMenuItem: string, setActiveMenuItem: (s: string) => void, scrollTo?: (id:string)=>void }) => {
  const menuItems = [
    
    { id: 'live-tracking', label: 'Live Vehicle Tracking', icon: MapPin },
    { id: 'active-vehicles', label: 'Active Vehicles', icon: Truck },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-teal-800 to-teal-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-teal-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
            <img
              src="/assets/icons/u4-logo.png"
              alt="U4GreenAFRICA"
              className="w-10 h-10 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target) {
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('img.fallback-svg');
                    if (fallback instanceof HTMLImageElement) fallback.style.display = 'block';
                  }
                }
              }}
            />
            <img src={logoSvg} alt="U4Green" className="fallback-svg w-10 h-10 object-cover hidden" />
          </div>
          <span className="text-xl font-bold">U4GreenAFRICA</span>
        </div>
      </div>

      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon as any;
            const isActive = activeMenuItem === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => { setActiveMenuItem(item.id); if (scrollTo) scrollTo(item.id); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-800/50'}`}>
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-teal-700">
        <UserProfile />
      </div>
    </div>
  );
};

function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fu = auth.currentUser;
    if (fu && fu.photoURL) setPhotoUrl(fu.photoURL);
    else setPhotoUrl(null);
  }, [user]);

  const displayName = user?.fullName && user.fullName.length > 0 ? user.fullName : (user?.email ? user.email.split('@')[0] : 'Utilisateur');
  const initials = user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase() : (user?.email ? user.email.slice(0,2).toUpperCase() : 'US');

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} className="w-10 h-10 object-cover" />
        ) : (
          <span className="text-sm font-semibold text-white">{initials}</span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-teal-300">{user?.email || ''}</p>
        <button
          onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch (err) {
              console.error('Logout failed', err);
            }
          }}
          className="mt-2 inline-block bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function MobileDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [animateStats, setAnimateStats] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');

  // refs for scroll targets
  const liveRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (id: string) => {
    try {
      if (id === 'live-tracking' && liveRef.current) {
        liveRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (id === 'active-vehicles' && activeRef.current) {
        activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      console.warn('Scroll failed', err);
    }
  };

  useEffect(() => {
    setAnimateStats(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = [
    { icon: Truck, label: 'Active Vehicles', value: '8', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Navigation, label: 'Tracking Now', value: '7', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Activity, label: 'Data Points/Hour', value: '480', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: MapIcon, label: 'Areas Covered', value: '12', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const vehicleData = [
    { id: 1, name: 'Vehicle Alpha', route: 'Route 1', pm25: 28.5, speed: 45, battery: 85, status: 'active', trend: 'down' },
    { id: 2, name: 'Vehicle Beta', route: 'Route 2', pm25: 62.3, speed: 32, battery: 92, status: 'active', trend: 'up' },
    { id: 3, name: 'Vehicle Gamma', route: 'Route 3', pm25: 19.8, speed: 58, battery: 67, status: 'active', trend: 'stable' },
    { id: 4, name: 'Vehicle Delta', route: 'Route 4', pm25: 75.1, speed: 28, battery: 78, status: 'active', trend: 'up' },
    { id: 5, name: 'Vehicle Epsilon', route: 'Route 5', pm25: 34.2, speed: 51, battery: 43, status: 'active', trend: 'down' },
    { id: 6, name: 'Vehicle Zeta', route: 'Route 6', pm25: 41.9, speed: 0, battery: 88, status: 'idle', trend: 'stable' },
  ];

  const getPM25Color = (value: number) => {
    if (value < 30) return 'text-green-600 bg-green-50';
    if (value < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBatteryColor = (value: number) => {
    if (value > 60) return 'text-green-600';
    if (value > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <>
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} scrollTo={scrollTo} />
      <div className="ml-64 min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
        {/* Stats Grid with Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform ${
                animateStats ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#343A40] mb-1">{stat.value}</div>
              <div className="text-sm text-[#343A40]/60">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Map Placeholder with Animation */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 animate-fadeIn">
          <h2 className="text-xl font-bold text-[#343A40] mb-4 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-[#2E8B57]" />
            Live Vehicle Tracking
          </h2>
          <div ref={liveRef} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            {/* Animated vehicle markers */}
            <div className="absolute top-20 left-20 animate-pulse">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <div className="absolute top-40 right-32 animate-pulse" style={{ animationDelay: '0.5s' }}>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <div className="absolute bottom-32 left-1/2 animate-pulse" style={{ animationDelay: '1s' }}>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-center text-[#343A40]/60 z-10">
              <Navigation className="w-16 h-16 mx-auto mb-4 opacity-30 animate-pulse" />
              <p className="font-semibold">Real-time GPS Tracking</p>
              <p className="text-sm mt-2">Vehicle positions update every 30 seconds</p>
            </div>
          </div>
        </div>

        {/* Enhanced Vehicle Table */}
        <div ref={activeRef} className="bg-white rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#343A40] flex items-center gap-2">
              <Truck className="w-6 h-6 text-[#2E8B57]" />
              Active Vehicles
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">Vehicle</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">Route</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">PM2.5 (µg/m³)</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">Speed (km/h)</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">Battery</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">Trend</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#343A40]">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicleData.map((vehicle, index) => (
                  <tr 
                    key={vehicle.id}
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-all duration-200 animate-slideIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#2E8B57]" />
                        <span className="font-semibold text-[#343A40]">{vehicle.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#343A40]/70">{vehicle.route}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1.5 rounded-lg font-bold ${getPM25Color(vehicle.pm25)}`}>
                        {vehicle.pm25}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{vehicle.speed}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Battery className={`w-5 h-5 ${getBatteryColor(vehicle.battery)}`} />
                        <span className={`font-semibold ${getBatteryColor(vehicle.battery)}`}>
                          {vehicle.battery}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getTrendIcon(vehicle.trend)}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        vehicle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Route Coverage Progress */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            { route: 'Route 1', coverage: 85, color: 'bg-green-500' },
            { route: 'Route 2', coverage: 62, color: 'bg-blue-500' },
            { route: 'Route 3', coverage: 94, color: 'bg-purple-500' },
          ].map((route, index) => (
            <div key={route.route} className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#343A40]">{route.route}</h3>
                <span className="text-sm font-semibold text-[#343A40]">{route.coverage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${route.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${route.coverage}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#343A40]/60 mt-2">Coverage completed</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(0deg, transparent 24%, rgba(46, 139, 87, .05) 25%, rgba(46, 139, 87, .05) 26%, transparent 27%, transparent 74%, rgba(46, 139, 87, .05) 75%, rgba(46, 139, 87, .05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(46, 139, 87, .05) 25%, rgba(46, 139, 87, .05) 26%, transparent 27%, transparent 74%, rgba(46, 139, 87, .05) 75%, rgba(46, 139, 87, .05) 76%, transparent 77%, transparent);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
    </>
  );
}
