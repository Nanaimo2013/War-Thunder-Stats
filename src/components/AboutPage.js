import React from 'react';
import { 
    Info, 
    Target, 
    BarChart3, 
    Users, 
    Shield, 
    Zap, 
    Database, 
    TrendingUp, 
    Award, 
    Gamepad2,
    Star,
    CheckCircle,
    ArrowRight,
    Download,
    Upload,
    Eye,
    BarChart,
    PieChart,
    LineChart
} from 'lucide-react';

const AboutPage = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Hero Section */}
            <div className="text-center py-6 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 animate-pulse">
                    <Gamepad2 size={40} className="text-gray-900" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent mb-4 animate-slide-up">
                    War Thunder Stats Tracker
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up-delay">
                    Your ultimate companion for mastering War Thunder. Track, analyze, and dominate the battlefield with precision.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Mission Statement */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl border border-gray-600 hover:border-yellow-400 transition-all duration-300 animate-fade-in">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                                <Target size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            To provide War Thunder enthusiasts with the most comprehensive and intuitive statistics tracking platform. 
                            We believe that understanding your performance is the key to becoming a better pilot and tank commander.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl border border-gray-600 hover:border-green-400 transition-all duration-300 animate-fade-in">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                                <Star size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Key Features</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: BarChart3, text: "Advanced Battle Analytics", color: "from-blue-500 to-cyan-500" },
                                { icon: Users, text: "Player Comparison Tools", color: "from-purple-500 to-pink-500" },
                                { icon: TrendingUp, text: "Performance Tracking", color: "from-green-500 to-emerald-500" },
                                { icon: Database, text: "Data Import/Export", color: "from-orange-500 to-red-500" },
                                { icon: Shield, text: "Local Data Storage", color: "from-indigo-500 to-blue-500" },
                                { icon: Zap, text: "Real-time Statistics", color: "from-yellow-500 to-orange-500" }
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 group">
                                    <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200`}>
                                        <feature.icon size={20} className="text-white" />
                                    </div>
                                    <span className="text-gray-200 font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Statistics Overview */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl border border-gray-600 hover:border-blue-400 transition-all duration-300 animate-fade-in">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-4">
                                <BarChart size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">What We Track</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Battle Results", value: "Win/Loss", icon: Award },
                                { label: "Combat Stats", value: "Kills/Assists", icon: Target },
                                { label: "Economic Data", value: "SL/RP", icon: TrendingUp },
                                { label: "Performance", value: "Activity/Time", icon: Eye }
                            ].map((stat, index) => (
                                <div key={index} className="bg-gray-700 p-4 rounded-lg text-center hover:bg-gray-600 transition-all duration-200">
                                    <stat.icon size={20} className="text-yellow-400 mx-auto mb-2" />
                                    <div className="text-white font-semibold">{stat.label}</div>
                                    <div className="text-gray-400 text-sm">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* How It Works */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl border border-gray-600 hover:border-purple-400 transition-all duration-300 animate-fade-in">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-4">
                                <Zap size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">How It Works</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { step: "1", title: "Upload Battle Logs", desc: "Paste your War Thunder battle logs directly into our parser", icon: Upload },
                                { step: "2", title: "Automatic Analysis", desc: "Our advanced parser extracts all relevant statistics", icon: BarChart3 },
                                { step: "3", title: "Visual Insights", desc: "View your performance through interactive charts and graphs", icon: PieChart },
                                { step: "4", title: "Track Progress", desc: "Monitor your improvement over time with detailed analytics", icon: LineChart }
                            ].map((item, index) => (
                                <div key={index} className="flex items-start space-x-4 group">
                                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm group-hover:scale-110 transition-transform duration-200">
                                        {item.step}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <item.icon size={18} className="text-yellow-400 mr-2" />
                                            <h3 className="text-white font-semibold">{item.title}</h3>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl border border-gray-600 hover:border-green-400 transition-all duration-300 animate-fade-in">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                                <CheckCircle size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Why Choose Us</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                "🔒 100% Local Storage - Your data never leaves your device",
                                "📊 Comprehensive Analytics - Track every aspect of your performance",
                                "🎯 Player Comparison - See how you stack up against others",
                                "📈 Progress Tracking - Monitor your improvement over time",
                                "🚀 Real-time Updates - Instant statistics after each battle",
                                "💾 Data Portability - Export and backup your data anytime"
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 group">
                                    <ArrowRight size={16} className="text-yellow-400 mr-3 group-hover:translate-x-1 transition-transform duration-200" />
                                    <span className="text-gray-200">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl border border-gray-600 hover:border-blue-400 transition-all duration-300 animate-fade-in">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-4">
                                <Info size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Technical Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-white font-semibold mb-2">Built With Modern Technology</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['React', 'Tailwind CSS', 'JavaScript', 'Local Storage'].map((tech, index) => (
                                        <span key={index} className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-full text-sm font-medium">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-white font-semibold mb-2">Data Security</h3>
                                <p className="text-gray-400 text-sm">
                                    All your battle data is stored locally in your browser's session storage. 
                                    No data is transmitted to external servers, ensuring complete privacy and security.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 text-center animate-fade-in">
                <div className="flex items-center justify-center mb-4">
                    <Shield size={20} className="text-yellow-400 mr-2" />
                    <span className="text-yellow-400 font-semibold">Important Notice</span>
                </div>
                <p className="text-gray-400 leading-relaxed max-w-4xl mx-auto">
                    This is an unofficial fan-made tool and is not affiliated with, endorsed, or sponsored by Gaijin Entertainment. 
            War Thunder and its associated logos are trademarks of Gaijin Entertainment.
                    This application is created by fans, for fans, to enhance the War Thunder gaming experience.
        </p>
            </div>
        </div>
    </div>
);

export default AboutPage; 