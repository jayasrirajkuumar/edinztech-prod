import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Card from '../components/ui/Card';
import logo from '../assets/logo.svg';

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export default function AdminLogin() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        try {
            const response = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            console.log('Admin Login Success:', result);
            localStorage.setItem('userInfo', JSON.stringify(result));

            navigate('/admin');
        } catch (error) {
            console.error('Login Error:', error);
            setError('root', {
                type: 'manual',
                message: error.message
            });
            setError('password', {
                type: 'manual',
                message: error.message
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="EdinzTech" className="h-12" />
                </div>
                <h2 className="mt-2 text-center text-2xl font-bold text-white tracking-tight">
                    Admin Portal Access
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="py-8 px-4 sm:rounded-lg sm:px-10 shadow-xl border-t-4 border-primary">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <Input
                                label="Admin Email"
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="admin@edinztech.com"
                                {...register('email')}
                                error={errors.email?.message}
                            />
                        </div>

                        <div>
                            <Input
                                label="Password"
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                {...register('password')}
                                error={errors.password?.message}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full flex justify-center py-3"
                                isLoading={isSubmitting}
                                variant="primary"
                            >
                                Sign in as Admin
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Looking for Student Login?
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <Link to="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
                                Return to Student Login
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
