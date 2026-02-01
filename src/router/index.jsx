import { createBrowserRouter } from 'react-router-dom';
import AdminQuizReports from '../pages/AdminQuizReports';
import AdminQuizAttemptDetail from '../pages/AdminQuizAttemptDetail'; // Added
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import Home from '../pages/Home';
import About from '../pages/About';
import Services from '../pages/Services';
import Process from '../pages/Process';
import Contact from '../pages/Contact';
import Courses from '../pages/Courses';
import CourseDetails from '../pages/CourseDetails';
import Internships from '../pages/Internships';
import InternshipDetails from '../pages/InternshipDetails';
import Workshops from '../pages/Workshops';
import WorkshopDetails from '../pages/WorkshopDetails';
import Verify from '../pages/Verify';
import Login from '../pages/Login';
import AdminLogin from '../pages/AdminLogin'; // Added
import Projects from '../pages/Projects';
import Success from '../pages/Success';
import Terms from '../pages/Terms';

import Privacy from '../pages/Privacy';
import PublicFeedback from '../pages/PublicFeedback'; // Added

// Auth Components
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Dashboard Pages
import Dashboard from '../pages/Dashboard';
import DashboardCourses from '../pages/DashboardCourses';
import DashboardInternships from '../pages/DashboardInternships';
import DashboardWorkshops from '../pages/DashboardWorkshops';
import DashboardCertificates from '../pages/DashboardCertificates';
import DashboardOfferLetters from '../pages/DashboardOfferLetters';
import DashboardQuizzes from '../pages/DashboardQuizzes';
import DashboardFeedbacks from '../pages/DashboardFeedbacks';

import FeedbackAttempt from '../pages/FeedbackAttempt';
import QuizAttempt from '../pages/QuizAttempt'; // Added import
import CertificateView from '../pages/CertificateView'; // Added import

// Admin Pages
import Admin from '../pages/Admin';
import AdminPrograms from '../pages/AdminPrograms';
import AdminProgramsNew from '../pages/AdminProgramsNew';
import AdminProgramsEdit from '../pages/AdminProgramsEdit';
import AdminQuizzes from '../pages/AdminQuizzes';
import AdminQuizzesNew from '../pages/AdminQuizzesNew';
import AdminQuizEdit from '../pages/AdminQuizEdit'; // Added
import AdminFeedbacks from '../pages/AdminFeedbacks';
import AdminFeedbacksNew from '../pages/AdminFeedbacksNew';
import AdminFeedbacksEdit from '../pages/AdminFeedbacksEdit';
import AdminTemplateCertificate from '../pages/admin/templates/certificate';
import AdminTemplateOfferLetter from '../pages/admin/templates/offer-letter';
import AdminInvitePage from '../pages/admin/invite';
import AdminEnrollments from '../pages/AdminEnrollments';

// Outsider Quiz Pages
import AdminOutsiderQuizzes from '../pages/AdminOutsiderQuizzes';
import AdminOutsiderQuizForm from '../pages/AdminOutsiderQuizForm';
import AdminOutsiderQuizResults from '../pages/AdminOutsiderQuizResults';
import PublicOutsiderQuiz from '../pages/PublicOutsiderQuiz';
import AdminTempFiles from '../pages/AdminTempFiles'; // New Page
import Gallery from '../pages/Gallery'; // Added
import AdminGallery from '../pages/AdminGallery'; // Added

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicLayout />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/about', element: <About /> },
            { path: '/services', element: <Services /> },
            { path: '/process', element: <Process /> },
            { path: '/projects', element: <Projects /> },
            { path: '/contact', element: <Contact /> },
            { path: '/courses', element: <Courses /> },
            { path: '/internships', element: <Internships /> },
            { path: '/workshops', element: <Workshops /> },
            { path: '/gallery', element: <Gallery /> }, // Added
            { path: '/programs/:id', element: <CourseDetails /> },
            { path: '/verify', element: <Verify /> },
            { path: '/login', element: <Login /> },
            { path: '/admin/login', element: <AdminLogin /> }, // Added
            { path: '/success', element: <Success /> },
            { path: '/certificate/view/:code', element: <CertificateView /> }, // New public route for viewing/printing
            { path: '/terms', element: <Terms /> },
            { path: '/privacy', element: <Privacy /> },
            { path: '/feedback/public', element: <PublicFeedback /> }, // Added
            { path: '/quiz/public/:id', element: <PublicOutsiderQuiz /> },
            { path: '*', element: <div className="p-20 text-center text-xl">Page Not Found (Custom Catch-All)</div> },
        ],
    },
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/dashboard/courses', element: <DashboardCourses /> },
            { path: '/dashboard/internships', element: <DashboardInternships /> },
            { path: '/dashboard/workshops', element: <DashboardWorkshops /> },
            { path: '/dashboard/certificates', element: <DashboardCertificates /> },
            { path: '/dashboard/offer-letters', element: <DashboardOfferLetters /> },
            { path: '/dashboard/quizzes', element: <DashboardQuizzes /> },
            { path: '/dashboard/quizzes/:id', element: <QuizAttempt /> }, // Added route
            { path: '/dashboard/feedbacks', element: <DashboardFeedbacks /> },

            { path: '/dashboard/feedbacks/:id', element: <FeedbackAttempt /> },
        ],
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute adminOnly={true}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: '/admin', element: <Admin /> },
            { path: '/admin/programs', element: <AdminPrograms /> },
            { path: '/admin/programs/new', element: <AdminProgramsNew /> },
            { path: '/admin/programs/:id/edit', element: <AdminProgramsEdit /> }, // Edit route
            { path: '/admin/quizzes', element: <AdminQuizzes /> },
            { path: '/admin/quizzes/new', element: <AdminQuizzesNew /> },
            { path: '/admin/quizzes/:id/edit', element: <AdminQuizEdit /> }, // Added
            { path: '/admin/quizzes/:id/reports', element: <AdminQuizReports /> },
            { path: '/admin/quizzes/attempt/:id', element: <AdminQuizAttemptDetail /> }, // Re-adding missing route
            { path: 'feedbacks', element: <AdminFeedbacks /> },
            { path: 'feedbacks/new', element: <AdminFeedbacksNew /> },
            { path: 'feedbacks/:id/edit', element: <AdminFeedbacksEdit /> },
            { path: '/admin/certificates', element: <AdminTemplateCertificate /> },
            { path: '/admin/offer-letters', element: <AdminTemplateOfferLetter /> },
            { path: '/admin/invite', element: <AdminInvitePage /> },
            { path: '/admin/gallery', element: <AdminGallery /> }, // Added

            { path: '/admin/enrollments', element: <AdminEnrollments /> },
            { path: '/admin/outsider-quizzes', element: <AdminOutsiderQuizzes /> },
            { path: '/admin/outsider-quizzes/new', element: <AdminOutsiderQuizForm /> },
            { path: '/admin/outsider-quizzes/:id/edit', element: <AdminOutsiderQuizForm /> },
            { path: '/admin/outsider-quizzes/:id/results', element: <AdminOutsiderQuizResults /> },
            { path: '/admin/outsider-quizzes/:id/results', element: <AdminOutsiderQuizResults /> },

            // System
            { path: '/admin/system/buffer', element: <AdminTempFiles /> },
        ],
    },
]);
