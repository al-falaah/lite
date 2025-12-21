// import { ImageResponse } from '@vercel/og';

// export const config = {
//   runtime: 'edge',
// };

// export default async function handler(request) {
//   try {
//     const { searchParams } = new URL(request.url);

//     // Get parameters from URL
//     const title = searchParams.get('title') || 'The FastTrack Madrasah';
//     const subtitle = searchParams.get('subtitle') || 'Online Islamic School | New Zealand';
//     const type = searchParams.get('type') || 'default'; // default, blog, program

//     return new ImageResponse(
//       (
//         <div
//           style={{
//             height: '100%',
//             width: '100%',
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             backgroundColor: '#065f46', // emerald-800
//             backgroundImage: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
//           }}
//         >
//           {/* Background Pattern */}
//           <div
//             style={{
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               opacity: 0.1,
//               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
//             }}
//           />

//           {/* Content Container */}
//           <div
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//               padding: '80px',
//               maxWidth: '1000px',
//               textAlign: 'center',
//             }}
//           >
//             {/* Logo/Brand */}
//             <div
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '20px',
//                 marginBottom: '40px',
//               }}
//             >
//               <div
//                 style={{
//                   width: '80px',
//                   height: '80px',
//                   borderRadius: '50%',
//                   backgroundColor: 'white',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   fontSize: '48px',
//                   color: '#065f46',
//                   fontWeight: 'bold',
//                 }}
//               >
//                 ا
//               </div>
//               <div
//                 style={{
//                   display: 'flex',
//                   flexDirection: 'column',
//                   alignItems: 'flex-start',
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: '32px',
//                     fontWeight: 'bold',
//                     color: 'white',
//                     letterSpacing: '-0.02em',
//                   }}
//                 >
//                   The FastTrack Madrasah
//                 </div>
//                 <div
//                   style={{
//                     fontSize: '18px',
//                     color: 'rgba(255,255,255,0.9)',
//                     fontWeight: '500',
//                   }}
//                 >
//                   {/* الفلاح */}
//                 </div>
//               </div>
//             </div>

//             {/* Main Title */}
//             <div
//               style={{
//                 fontSize: type === 'blog' ? '56px' : '64px',
//                 fontWeight: 'bold',
//                 color: 'white',
//                 lineHeight: 1.2,
//                 marginBottom: '30px',
//                 maxWidth: '900px',
//                 textAlign: 'center',
//               }}
//             >
//               {title}
//             </div>

//             {/* Subtitle */}
//             <div
//               style={{
//                 fontSize: '28px',
//                 color: 'rgba(255,255,255,0.95)',
//                 lineHeight: 1.4,
//                 maxWidth: '800px',
//                 fontWeight: '400',
//               }}
//             >
//               {subtitle}
//             </div>

//             {/* Bottom Badge */}
//             <div
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '15px',
//                 marginTop: '50px',
//                 padding: '15px 30px',
//                 backgroundColor: 'rgba(255,255,255,0.15)',
//                 borderRadius: '50px',
//                 backdropFilter: 'blur(10px)',
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: '20px',
//                   color: 'white',
//                   fontWeight: '600',
//                 }}
//               >
//                 🇳🇿 New Zealand
//               </div>
//               <div
//                 style={{
//                   width: '2px',
//                   height: '20px',
//                   backgroundColor: 'rgba(255,255,255,0.4)',
//                 }}
//               />
//               <div
//                 style={{
//                   fontSize: '20px',
//                   color: 'white',
//                   fontWeight: '600',
//                 }}
//               >
//                 📚 Islamic Education
//               </div>
//             </div>
//           </div>
//         </div>
//       ),
//       {
//         width: 1200,
//         height: 630,
//       }
//     );
//   } catch (e) {
//     console.error(e);
//     return new Response(`Failed to generate image`, {
//       status: 500,
//     });
//   }
// }
