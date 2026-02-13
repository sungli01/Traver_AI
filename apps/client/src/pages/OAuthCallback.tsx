import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTE_PATHS } from '@/lib/index';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error('소셜 로그인에 실패했습니다');
      navigate(ROUTE_PATHS.LOGIN);
      return;
    }

    if (token) {
      localStorage.setItem('auth_token', token);
      loadFromStorage().then(() => {
        toast.success('로그인 성공!');
        navigate(ROUTE_PATHS.DASHBOARD);
      });
    } else {
      navigate(ROUTE_PATHS.LOGIN);
    }
  }, [navigate, loadFromStorage]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
