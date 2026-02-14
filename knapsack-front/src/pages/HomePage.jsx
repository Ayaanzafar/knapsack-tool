// // import { useState } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuth } from '../context/AuthContext';

// // export default function HomePage() {
// //   const navigate = useNavigate();
// //   const { isAuthenticated, user, logout, login } = useAuth();

// //   const [username, setUsername] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [error, setError] = useState('');
// //   const [isLoading, setIsLoading] = useState(false);

// //   const handleCreateBOM = () => {
// //     navigate('/projects/create');
// //   };

// //   const handleLongRail = () => {
// //     navigate('/projects/create');
// //   };

// //   const handleLogin = async (e) => {
// //     e.preventDefault();
// //     setError('');
// //     setIsLoading(true);

// //     try {
// //       const { user: loggedInUser } = await login(username, password);
// //       if (loggedInUser.mustChangePassword) {
// //         navigate('/change-password');
// //       }
// //       // After successful login, user stays on HomePage (authenticated view)
// //     } catch (err) {
// //       setError(err.message || 'Failed to login');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const isManager = user?.role === 'MANAGER';

// //   // Landing Page for Unauthenticated Users
// //   if (!isAuthenticated) {
// //     return (
// //       <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
// //         {/* Header */}
// //         <header className="bg-white shadow-sm h-20">
// //           <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
// //             <img
// //               src="/white_back_photo.svg"
// //               alt="Knapsack Tool"
// //               className="h-8"
// //             />
// //           </div>
// //         </header>

// //         <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
// //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
// //             {/* Left Side - Site Information */}
// //             <div className="space-y-8">
// //               <div>
// //                 <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
// //                   Solar Rail BOM Management System
// //                 </h2>
// //                 <p className="mt-4 text-xl text-gray-600">
// //                   Internal tool for creating and optimizing Bills of Materials for solar panel installations.
// //                 </p>
// //               </div>

// //               {/* Features */}
// //               <div className="space-y-4">
// //                 <h3 className="text-2xl font-bold text-gray-800">Features</h3>
// //                 <div className="space-y-3">
// //                   <div className="flex items-start gap-3">
// //                     <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
// //                       <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
// //                       </svg>
// //                     </div>
// //                     <div>
// //                       <p className="font-semibold text-gray-900">Long Rail Profile BOM Creation</p>
// //                       <p className="text-sm text-gray-600">Create detailed BOMs for U Cleat Long Rail profiles with automated calculations</p>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-start gap-3">
// //                     <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
// //                       <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
// //                       </svg>
// //                     </div>
// //                     <div>
// //                       <p className="font-semibold text-gray-900">Multi-Building Support</p>
// //                       <p className="text-sm text-gray-600">Manage BOMs across multiple buildings in a single project</p>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-start gap-3">
// //                     <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
// //                       <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
// //                       </svg>
// //                     </div>
// //                     <div>
// //                       <p className="font-semibold text-gray-900">Cost & Weight Calculations</p>
// //                       <p className="text-sm text-gray-600">Automatic calculation of material costs, weights, and spare quantities</p>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-start gap-3">
// //                     <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
// //                       <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
// //                       </svg>
// //                     </div>
// //                     <div>
// //                       <p className="font-semibold text-gray-900">Export to PDF</p>
// //                       <p className="text-sm text-gray-600">Generate professional PDF reports with customizable sections</p>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Right Side - Login Form */}
// //             <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
// //               <div className="mb-8">
// //                 <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
// //                 <p className="mt-2 text-sm text-gray-600">
// //                   Enter your credentials to access the BOM management system
// //                 </p>
// //               </div>

// //               <form className="space-y-6" onSubmit={handleLogin}>
// //                 <div>
// //                   <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
// //                     Username
// //                   </label>
// //                   <input
// //                     id="username"
// //                     name="username"
// //                     type="text"
// //                     required
// //                     value={username}
// //                     onChange={(e) => setUsername(e.target.value)}
// //                     className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
// //                     placeholder="Enter your username"
// //                   />
// //                 </div>

// //                 <div>
// //                   <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
// //                     Password
// //                   </label>
// //                   <input
// //                     id="password"
// //                     name="password"
// //                     type="password"
// //                     required
// //                     value={password}
// //                     onChange={(e) => setPassword(e.target.value)}
// //                     className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
// //                     placeholder="Enter your password"
// //                   />
// //                 </div>

// //                 {error && (
// //                   <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
// //                     {error}
// //                   </div>
// //                 )}

// //                 <button
// //                   type="submit"
// //                   disabled={isLoading}
// //                   className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
// //                     isLoading ? 'opacity-50 cursor-not-allowed' : ''
// //                   }`}
// //                 >
// //                   {isLoading ? (
// //                     <>
// //                       <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// //                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// //                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// //                       </svg>
// //                       Signing in...
// //                     </>
// //                   ) : (
// //                     'Sign In'
// //                   )}
// //                 </button>
// //               </form>
// //             </div>
// //           </div>
// //         </main>

// //         {/* <footer className="py-8 text-center text-sm text-gray-500">
// //           Rail Cut Optimizer - Built for solar rail standardization
// //         </footer> */}
// //       </div>
// //     );
// //   }

// //   // Authenticated HomePage - BOM Creation Interface
// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <header className="bg-white shadow h-20">
// //         <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
// //           <img
// //             src="/white_back_photo.svg"
// //             alt="Knapsack Tool"
// //             className="h-8"
// //           />
// //           <div className="flex items-center gap-4">
// //             {isManager && (
// //               <button
// //                 onClick={() => navigate('/admin')}
// //                 className="px-4 py-2 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
// //               >
// //                 Admin Panel
// //               </button>
// //             )}
// //             <button
// //               onClick={logout}
// //               className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
// //             >
// //               Logout
// //             </button>
// //           </div>
// //         </div>
// //       </header>

// //       <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
// //         <div className="text-center mb-16">
// //           <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
// //             Bill Of Material
// //           </h2>
// //           <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
// //             Internal tool for making and generating Bills of Materials for Solar Rails.
// //           </p>
// //         </div>

// //         <div className="max-w-4xl mx-auto">
// //           <h3 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-2">Create BOM for:</h3>

// //           <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
// //             {/* Long Rail Card */}
// //             <div
// //               onClick={handleLongRail}
// //               className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center text-center hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-md cursor-pointer transition-all group"
// //             >
// //               <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
// //                 <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
// //                 </svg>
// //               </div>
// //               <p className="text-xl font-bold text-gray-900 mb-2">Long Rail</p>
// //               <p className="text-sm text-gray-500">Optimization tool for standard long rail cutting.</p>
// //               <div className="mt-6 text-blue-600 font-semibold flex items-center gap-1">
// //                 Get Started
// //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
// //                   <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
// //                 </svg>
// //               </div>
// //             </div>

// //             {/* Placeholder for future BOM types */}
// //             <div className="relative rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center text-center opacity-60 grayscale">
// //               <div className="h-16 w-16 rounded-2xl bg-gray-200 flex items-center justify-center mb-4">
// //                 <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                 </svg>
// //               </div>
// //               <p className="text-xl font-bold text-gray-400 mb-2">Coming Soon</p>
// //               <p className="text-sm text-gray-400">Other BOM types will be added here.</p>
// //             </div>
// //           </div>
// //         </div>
// //       </main>

// //       {/* <footer className="py-8 text-center text-xs text-gray-500">
// //         Rail Cut Optimizer - Built for solar rail standardization
// //       </footer> */}
// //     </div>
// //   );
// // }






// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import Shuffle from './Shuffle';
// import ElectricBorder from './ElectricBorder';
// import SplitText from './SplitText';

// export default function HomePage() {
//   const navigate = useNavigate();
//   const { isAuthenticated, user, logout, login } = useAuth();

//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const handleCreateBOM = () => {
//     navigate('/projects/create');
//   };

//   const handleLongRail = () => {
//     navigate('/projects/create');
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       const { user: loggedInUser } = await login(username, password);
//       if (loggedInUser.mustChangePassword) {
//         navigate('/change-password');
//       }
//       // After successful login, user stays on HomePage (authenticated view)
//     } catch (err) {
//       setError(err.message || 'Failed to login');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAnimationComplete = () => {
//     console.log('All letters have animated!');
//   };

//   const isManager = user?.role === 'MANAGER';

//   // Landing Page for Unauthenticated Users
//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-linear-to-br from-yellow-300 via-yellow-100 to-white transition-colors duration-500">
//         {/* Header with stronger emphasis */}
//         <header className="bg-gray-900 shadow-lg border-b border-yellow-400">
//           <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center">
//             <img
//               src="/black_back_photo.svg"
//               alt="Knapsack Tool"
//               className="h-9 transition-transform hover:scale-105"
//             />
//           </div>
//         </header>

//         <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
//             {/* Left Side - Site Information with improved hierarchy */}
//             <div className="space-y-12 pt-4">
//               <div className="space-y-6">
//                 <h1 className="text-5xl font-bold sm:text-6xl leading-tight tracking-tight text-black">
//                   <Shuffle
//                     text="Bill Of Material"
//                     shuffleDirection="right"
//                     duration={0.35}
//                     animationMode="evenodd"
//                     shuffleTimes={1}
//                     ease="power3.out"
//                     stagger={0.03}
//                     threshold={0.1}
//                     triggerOnce={false}
//                     triggerOnHover={true}
//                     respectReducedMotion={true}
//                   />
//                   <span className="block text-yellow-600 mt-2">
//                     <Shuffle
//                       text="Management System"
//                       shuffleDirection="right"
//                       duration={0.35}
//                       animationMode="evenodd"
//                       shuffleTimes={1}
//                       ease="power3.out"
//                       stagger={0.03}
//                       threshold={0.1}
//                       triggerOnce={false}
//                       triggerOnHover={true}
//                       respectReducedMotion={true}
//                     />
//                   </span>
//                 </h1>
//                 <p className="text-lg text-gray-800 leading-relaxed max-w-xl font-medium">
//                   Internal tool for creating and optimizing Bills of Materials for solar panel mounting structures.
//                 </p>
//               </div>

//               {/* Features with better spacing and layering */}
//               <div className="space-y-6 pt-4">
//                 <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
//                 <div className="space-y-4">
//                   <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
//                     <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
//                       <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                     <div className="space-y-1 flex-1">
//                       <p className="font-semibold text-yellow-400 text-base">Multiple MMS Support</p>
//                       <p className="text-sm text-gray-300 leading-relaxed">Create detailed BOMs for Multiple MMS Types with automated calculations</p>
//                     </div>
//                   </div>

//                   <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
//                     <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
//                       <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                     <div className="space-y-1 flex-1">
//                       <p className="font-semibold text-yellow-400 text-base">Multi-Building Support</p>
//                       <p className="text-sm text-gray-300 leading-relaxed">Manage BOMs across multiple buildings in a single project</p>
//                     </div>
//                   </div>

//                   <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
//                     <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
//                       <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                     <div className="space-y-1 flex-1">
//                       <p className="font-semibold text-yellow-400 text-base">Cost & Weight Calculations</p>
//                       <p className="text-sm text-gray-300 leading-relaxed">Automatic calculation of material costs, weights, and spare quantities</p>
//                     </div>
//                   </div>

//                   <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
//                     <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
//                       <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                     <div className="space-y-1 flex-1">
//                       <p className="font-semibold text-yellow-400 text-base">Export to PDF</p>
//                       <p className="text-sm text-gray-300 leading-relaxed">Generate professional PDF reports with customizable sections</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Side - Login Form with enhanced layering */}
//             <div className="lg:pt-4">
//               <ElectricBorder
//                 color="#FAD90E"
//                 speed={1}
//                 chaos={0.5}
//                 thickness={3}
//                 style={{ borderRadius: 16 }}
//               >
//                 <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-10 lg:p-12 relative overflow-hidden">
//                   {/* Subtle background decoration */}
//                   <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-yellow-900 to-transparent rounded-full -mr-20 -mt-20 opacity-20"></div>
                  
//                   <div className="relative z-10">
//                     <div className="mb-10">
//                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-linear-to-br from-yellow-400 to-yellow-500 shadow-lg mb-4">
//                         <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
//                         </svg>
//                       </div>
//                       <SplitText
//                         text="Welcome Back!"
//                         className="text-3xl font-bold text-yellow-400 mb-2"
//                         delay={100}
//                         duration={0.6}
//                         ease="power3.out"
//                         splitType="chars"
//                         from={{ opacity: 0, y: 40 }}
//                         to={{ opacity: 1, y: 0 }}
//                         threshold={0.1}
//                         rootMargin="-100px"
//                         textAlign="left"
//                         onLetterAnimationComplete={handleAnimationComplete}
//                       />
//                       <p className="text-base text-gray-400 mt-2">
//                         Sign in to access the BOM management system
//                       </p>
//                     </div>

//                     <form className="space-y-6" onSubmit={handleLogin}>
//                       <div className="space-y-2">
//                         <label htmlFor="username" className="block text-sm font-semibold text-yellow-400">
//                           Username
//                         </label>
//                         <input
//                           id="username"
//                           name="username"
//                           type="text"
//                           required
//                           value={username}
//                           onChange={(e) => setUsername(e.target.value)}
//                           className="appearance-none block w-full px-4 py-3.5 border border-gray-700 bg-gray-800 text-white rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-base"
//                           placeholder="Enter your username"
//                         />
//                       </div>

//                       <div className="space-y-2">
//                         <label htmlFor="password" className="block text-sm font-semibold text-yellow-400">
//                           Password
//                         </label>
//                         <input
//                           id="password"
//                           name="password"
//                           type="password"
//                           required
//                           value={password}
//                           onChange={(e) => setPassword(e.target.value)}
//                           className="appearance-none block w-full px-4 py-3.5 border border-gray-700 bg-gray-800 text-white rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-base"
//                           placeholder="Enter your password"
//                         />
//                       </div>

//                       {error && (
//                         <div className="bg-red-900 border-l-4 border-red-500 text-red-200 px-4 py-3.5 rounded-lg text-sm font-medium shadow-sm">
//                           {error}
//                         </div>
//                       )}

//                       <button
//                         type="submit"
//                         disabled={isLoading}
//                         className={`w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-gray-900 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transform transition-all duration-200 ${
//                           isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'
//                         }`}
//                       >
//                         {isLoading ? (
//                           <>
//                             <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                             </svg>
//                             Signing in...
//                           </>
//                         ) : (
//                           <>
//                             Sign In
//                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                             </svg>
//                           </>
//                         )}
//                       </button>
//                     </form>
//                   </div>
//                 </div>
//               </ElectricBorder>
//             </div>
//           </div>
//         </main>

//         {/* Footer for visual closure */}
//         <footer className="mt-20 py-8 border-t border-gray-800 bg-gray-900">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <p className="text-center text-sm text-gray-400">
//               Solar Rail BOM Management System — Internal Tool
//             </p>
//           </div>
//         </footer>
//       </div>
//     );
//   }

//   // Authenticated HomePage - BOM Creation Interface
//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-50 to-gray-100">
//       <header className="bg-white shadow-sm border-b border-gray-200">
//         <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
//           <img
//             src="/white_back_photo.svg"
//             alt="Knapsack Tool"
//             className="h-9 transition-transform hover:scale-105"
//           />
//           <div className="flex items-center gap-3">
//             {isManager && (
//               <button
//                 onClick={() => navigate('/admin')}
//                 className="px-5 py-2.5 border-2 border-purple-600 text-sm font-semibold rounded-lg text-purple-600 bg-white hover:bg-purple-50 transition-all duration-200 hover:shadow-md"
//               >
//                 Admin Panel
//               </button>
//             )}
//             <button
//               onClick={logout}
//               className="px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
//         {/* <div className="text-center mb-20">
//           <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl sm:tracking-tight lg:text-7xl mb-6">
//             Bill Of Material
//           </h1>
//           <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
//             Internal tool for making and generating Bills of Materials for Solar Rails.
//           </p>
//         </div> */}

//         <div className="max-w-5xl mx-auto">
//           <div className="mb-12 pb-6 border-b-2 border-gray-300">
//             <h2 className="text-3xl font-bold text-gray-900">Create BOM for:</h2>
//           </div>

//           <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
//             {/* Long Rail Card with enhanced design */}
//             <div
//               onClick={handleLongRail}
//               className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-md flex flex-col items-center text-center hover:border-blue-500 hover:shadow-xl cursor-pointer transition-all duration-300 group transform hover:-translate-y-1 min-h-[200px]"
//             >
//               <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
//                 <svg className="h-11 w-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                 </svg>
//               </div>
//               <p className="text-2xl font-bold text-gray-900 mb-3">Long Rail</p>
//               {/* <p className="text-sm text-gray-600 leading-relaxed mb-6">Optimization tool for standard long rail cutting.</p> */}
//               <div className="mt-auto pt-4 text-blue-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
//                 Get Started
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
//                 </svg>
//               </div>
//             </div>

//             {/* Placeholder cards with consistent styling */}
//             <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 flex flex-col items-center text-center shadow-sm min-h-[200px]">
//               <div className="h-20 w-20 rounded-2xl bg-gray-200 flex items-center justify-center mb-6">
//                 <svg className="h-11 w-11 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <p className="text-2xl font-bold text-gray-400 mb-3">Hand Rail</p>
//               {/* <p className="text-sm text-gray-500 leading-relaxed">Other BOM types will be added here.</p> */}
//             </div>

//             <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 flex flex-col items-center text-center shadow-sm min-h-[200px]">
//               <div className="h-20 w-20 rounded-2xl bg-gray-200 flex items-center justify-center mb-6">
//                 <svg className="h-11 w-11 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <p className="text-2xl font-bold text-gray-400 mb-3">Walk Way</p>
//               {/* <p className="text-sm text-gray-500 leading-relaxed">Other BOM types will be added here.</p> */}
//             </div>
//             <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 flex flex-col items-center text-center shadow-sm min-h-[200px]">
//               <div className="h-20 w-20 rounded-2xl bg-gray-200 flex items-center justify-center mb-6">
//                 <svg className="h-11 w-11 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <p className="text-2xl font-bold text-gray-400 mb-3">Coming Soon</p>
//               {/* <p className="text-sm text-gray-500 leading-relaxed">Other BOM types will be added here.</p> */}
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Footer for visual closure */}
//       {/* <footer className="mt-20 py-8 border-t border-gray-300">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <p className="text-center text-sm text-gray-500">
//             Solar Rail BOM Management System — Internal Tool
//           </p>
//         </div>
//       </footer> */}
//     </div>
//   );
// }












import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bomShareAPI from '../services/bomShareAPI';
import Shuffle from './shuffle';
import ElectricBorder from './ElectricBorder';
import SplitText from './SplitText';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newSharesCount, setNewSharesCount] = useState(0);

  // Fetch new shares count when authenticated
  useEffect(() => {
    const fetchNewSharesCount = async () => {
      if (isAuthenticated) {
        try {
          const response = await bomShareAPI.getNewSharesCount();
          setNewSharesCount(response.count || 0);
        } catch (error) {
          console.error('Failed to fetch new shares count:', error);
        }
      }
    };

    fetchNewSharesCount();
  }, [isAuthenticated]);

  const handleCreateBOM = () => {
    navigate('/projects/create');
  };

  const handleLongRail = () => {
    navigate('/projects/create');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user: loggedInUser } = await login(username, password);
      if (loggedInUser.mustChangePassword) {
        navigate('/change-password');
      } else {
        // Check if there's a redirect path stored (from PrivateRoute)
        const from = location.state?.from?.pathname || null;
        if (from) {
          // Redirect to the original path they were trying to access
          navigate(from, { replace: true });
        }
        // Otherwise, user stays on HomePage (authenticated view)
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };

  const isManager = user?.role === 'MANAGER';

  // Landing Page for Unauthenticated Users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-yellow-300 via-yellow-100 to-white transition-colors duration-500">
        {/* Header with stronger emphasis */}
        <header className="bg-gray-900 shadow-lg border-b border-yellow-400">
          <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center">
            <img
              src="/black_back_photo.svg"
              alt="Knapsack Tool"
              className="h-9 transition-transform hover:scale-105"
            />
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Site Information with improved hierarchy */}
            <div className="space-y-12 pt-4">
              <div className="space-y-6">
                <h1 className="text-5xl font-bold sm:text-6xl leading-tight tracking-tight text-black">
                  <Shuffle
                    text="Bill Of Material"
                    shuffleDirection="right"
                    duration={0.35}
                    animationMode="evenodd"
                    shuffleTimes={1}
                    ease="power3.out"
                    stagger={0.03}
                    threshold={0.1}
                    triggerOnce={false}
                    triggerOnHover={true}
                    respectReducedMotion={true}
                  />
                  <span className="block text-yellow-600 mt-2">
                    <Shuffle
                      text="Management System"
                      shuffleDirection="right"
                      duration={0.35}
                      animationMode="evenodd"
                      shuffleTimes={1}
                      ease="power3.out"
                      stagger={0.03}
                      threshold={0.1}
                      triggerOnce={false}
                      triggerOnHover={true}
                      respectReducedMotion={true}
                    />
                  </span>
                </h1>
                <p className="text-lg text-gray-800 leading-relaxed max-w-xl font-medium">
                  Internal tool for creating and optimizing Bills of Materials for solar panel mounting structures.
                </p>
              </div>

              {/* Features with better spacing and layering */}
              <div className="space-y-6 pt-4">
                <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
                      <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-yellow-400 text-base">Multiple MMS Support</p>
                      <p className="text-sm text-gray-300 leading-relaxed">Create detailed BOMs for Multiple MMS Types with automated calculations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
                      <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-yellow-400 text-base">Multi-Building Support</p>
                      <p className="text-sm text-gray-300 leading-relaxed">Manage BOMs across multiple buildings in a single project</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
                      <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-yellow-400 text-base">Cost & Weight Calculations</p>
                      <p className="text-sm text-gray-300 leading-relaxed">Automatic calculation of material costs, weights, and spare quantities</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border-2 border-yellow-400 shadow-lg hover:shadow-yellow-400/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/50 group-hover:shadow-lg transition-all duration-300">
                      <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-yellow-400 text-base">Export to PDF</p>
                      <p className="text-sm text-gray-300 leading-relaxed">Generate professional PDF reports with customizable sections</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form with enhanced layering */}
            <div className="lg:pt-4">
              <ElectricBorder
                color="#FAD90E"
                speed={1}
                chaos={0.5}
                thickness={3}
                style={{ borderRadius: 16 }}
              >
                <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-10 lg:p-12 relative overflow-hidden">
                  {/* Subtle background decoration */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-yellow-900 to-transparent rounded-full -mr-20 -mt-20 opacity-20"></div>
                  
                  <div className="relative z-10">
                    <div className="mb-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-linear-to-br from-yellow-400 to-yellow-500 shadow-lg mb-4">
                        <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <SplitText
                        text="Welcome Back!"
                        className="text-3xl font-bold text-yellow-400 mb-2"
                        delay={100}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 40 }}
                        to={{ opacity: 1, y: 0 }}
                        threshold={0.1}
                        rootMargin="-100px"
                        textAlign="left"
                        onLetterAnimationComplete={handleAnimationComplete}
                      />
                      <p className="text-base text-gray-400 mt-2">
                        Sign in to access the BOM management system
                      </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                      <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-semibold text-yellow-400">
                          Username
                        </label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="appearance-none block w-full px-4 py-3.5 border border-gray-700 bg-gray-800 text-white rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-base"
                          placeholder="Enter your username"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-yellow-400">
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="appearance-none block w-full px-4 py-3.5 border border-gray-700 bg-gray-800 text-white rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-base"
                          placeholder="Enter your password"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-900 border-l-4 border-red-500 text-red-200 px-4 py-3.5 rounded-lg text-sm font-medium shadow-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-gray-900 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transform transition-all duration-200 ${
                          isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </ElectricBorder>
            </div>
          </div>
        </main>

        {/* Footer for visual closure */}
        <footer className="mt-20 py-8 border-t border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">
              Solar Rail BOM Management System — Internal Tool
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated HomePage - BOM Creation Interface
// BOM Module Configuration
  const bomModules = [
    {
      id: 'long-rail',
      title: 'Long Rail',
      description: 'Standard rail mounting optimization',
      icon: (
        <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      available: true,
      badge: 'Active',
      badgeColor: 'bg-green-500',
      onClick: handleLongRail
    },
    {
      id: 'hand-rail',
      title: 'Hand Rail',
      description: 'Safety rail system planning',
      icon: (
        <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      available: false,
      badge: 'Coming Soon',
      badgeColor: 'bg-gray-400'
    },
    {
      id: 'walk-way',
      title: 'Walk Way',
      description: 'Maintenance pathway configuration',
      icon: (
        <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      available: false,
      badge: 'Q1 2026',
      badgeColor: 'bg-blue-400'
    },
    {
      id: 'future-module',
      title: 'More Coming',
      description: 'Additional modules in development',
      icon: (
        <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      available: false,
      badge: 'Planned',
      badgeColor: 'bg-purple-400'
    }
  ];

  // Authenticated HomePage - BOM Creation Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-100 to-white transition-colors duration-500">
      {/* Header with enhanced styling */}
      <header className="bg-yellow-50/80 backdrop-blur-sm border-b-2 border-yellow-300 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <img
            src="/white_back_photo.svg"
            alt="Knapsack Tool"
            className="h-10 transition-transform hover:scale-105 duration-300"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/shared-with-me')}
              className="relative px-5 py-2.5 border-2 border-purple-600 bg-white text-purple-600 text-sm font-semibold rounded-lg hover:bg-purple-50 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
              aria-label="View Shared BOMs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Shared with Me
              {newSharesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {newSharesCount}
                </span>
              )}
            </button>
            {isManager && (
              <button
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 border-2 border-black bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                aria-label="Go to Admin Panel"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-black text-yellow-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Title Section with animation */}
          <div className="mb-12 pb-6 border-b-2 border-black">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight mb-3">
              Create BOM for:
            </h1>
            <p className="text-gray-700 text-lg">Select a module to begin your Bill of Materials</p>
          </div>

          {/* Cards Grid with stagger animation */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {bomModules.map((module, index) => (
              <div
                key={module.id}
                onClick={module.available ? module.onClick : undefined}
                className={`relative rounded-2xl border-2 p-8 flex flex-col items-center text-center shadow-md transition-all duration-300 min-h-[280px] group
                  ${module.available 
                    ? 'border-black bg-white cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-400/30 hover:bg-yellow-50' 
                    : 'border-gray-300 bg-white/70 backdrop-blur-sm'
                  }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  opacity: 0
                }}
                role={module.available ? "button" : "article"}
                tabIndex={module.available ? 0 : -1}
                aria-label={module.available ? `Open ${module.title} module` : `${module.title} - ${module.badge}`}
              >
                {/* Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white ${module.badgeColor} shadow-sm`}>
                  {module.badge}
                </div>

                {/* Icon Container */}
                <div className={`relative h-20 w-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
                  ${module.available 
                    ? 'bg-black text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black group-hover:scale-110 group-hover:rotate-3' 
                    : 'bg-gray-200 text-gray-400'
                  }`}>
                  {module.icon}
                  
                  {/* Pulse effect for active module */}
                  {module.available && (
                    <span className="absolute inset-0 rounded-2xl bg-yellow-400 animate-ping opacity-20"></span>
                  )}
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-bold mb-2 ${module.available ? 'text-black' : 'text-gray-500'}`}>
                  {module.title}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-6 ${module.available ? 'text-gray-600' : 'text-gray-400'}`}>
                  {module.description}
                </p>

                {/* CTA for available modules */}
                {module.available && (
                  <div className="mt-auto pt-4 text-black font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                    Open Module
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Notification for unavailable modules */}
                {!module.available && (
                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500 font-medium">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      In Development
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="mt-12 p-6 bg-black/90 backdrop-blur-sm rounded-2xl border-2 border-yellow-400 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-1">Need Help?</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Select an active module to start creating your Bill of Materials. Each module is optimized for specific solar panel mounting structures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add keyframe animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );

}