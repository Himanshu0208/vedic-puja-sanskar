import { useSelector } from 'react-redux';
import { RootState } from '@/store';


export function useAuth() {
    const user = useSelector((state: RootState) => state.auth.user);
    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return { user, isAuthenticated, isAdmin };
}