import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Card from '../components/ui/Card';
import api from '../lib/api';
import logo from '../assets/logo.svg';

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export default function Login() {
    const navigate = useNavigate();
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotMessage, setForgotMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    // Separate form for forgot password
    const {
        register: registerForgot,
        handleSubmit: handleSubmitForgot,
        formState: { errors: errorsForgot, isSubmitting: isSubmittingForgot },
        setError: setErrorForgot,
    } = useForm({
        resolver: zodResolver(z.object({
            email: z.string().min(1, 'Email is required').email('Invalid email address')
        }))
    });

    const extractAuthToken = (result) => {
        return result?.token
            || result?.accessToken
            || result?.data?.token
            || result?.data?.accessToken
            || result?.data?.data?.token
            || result?.data?.data?.accessToken;
    };

    const onSubmit = async (data) => {
        try {
            const response = await api.post('/auth/login', data);
            const result = response.data;

            const token = extractAuthToken(result);
            if (!token) {
                throw new Error('Login succeeded but no token was returned.');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify({ ...result, token }));

            console.log('Login Success:', result);
            navigate('/dashboard');
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

    const onForgotSubmit = async (data) => {
        setForgotMessage('');
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to send recovery email');
            }

            setForgotMessage(result.message || 'Credentials sent to your email.');
        } catch (error) {
            setErrorForgot('root', {
                type: 'manual',
                message: error.message
            });
        }
    };

    const toggleView = () => {
        setIsForgotPassword(!isForgotPassword);
        setForgotMessage('');
        reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="EdinzTech" className="h-12" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isForgotPassword ? 'Reset Password' : 'Student Portal'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {isForgotPassword
                        ? 'Enter your email to receive your credentials'
                        : 'Sign in to access your courses and certificates'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="py-8 px-4 sm:rounded-lg sm:px-10 shadow-lg border-t-4 border-primary">
                    {!isForgotPassword ? (
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <Input
                                    label="Email address"
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="student@example.com"
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                            </div>

                            <div>
                                <Input
                                    label="Password"
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                    error={errors.password?.message}
                                    rightElement={
                                        <button
                                            type="button"
                                            className="focus:outline-none"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                                        </button>
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={toggleView}
                                        className="font-medium text-secondary hover:text-primary transition-colors focus:outline-none"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full flex justify-center py-3"
                                    isLoading={isSubmitting}
                                    variant="primary"
                                >
                                    Sign in
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmitForgot(onForgotSubmit)}>
                            {forgotMessage && (
                                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative" role="alert">
                                    <span className="block sm:inline">{forgotMessage}</span>
                                </div>
                            )}

                            {errorsForgot.root && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                                    <span className="block sm:inline">{errorsForgot.root.message}</span>
                                </div>
                            )}

                            <div>
                                <Input
                                    label="Email address"
                                    id="forgot-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="student@example.com"
                                    {...registerForgot('email')}
                                    error={errorsForgot.email?.message}
                                />
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full flex justify-center py-3"
                                    isLoading={isSubmittingForgot}
                                    variant="primary"
                                >
                                    Send Credentials
                                </Button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={toggleView}
                                    className="text-sm text-gray-600 hover:text-gray-900 font-medium focus:outline-none"
                                >
                                    &larr; Back to Login
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Or
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center text-xs text-gray-400">
                            <Link to="/" className="hover:text-gray-600">Back to Home</Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}