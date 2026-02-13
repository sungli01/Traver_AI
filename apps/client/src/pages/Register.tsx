import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} 소셜 로그인은 준비 중입니다`);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }
    if (password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다');
      return;
    }
    const success = await register(name, email, password);
    if (success) {
      toast.success('회원가입 성공!');
      navigate(ROUTE_PATHS.DASHBOARD);
    } else {
      const error = useAuthStore.getState().error;
      toast.error(error || '회원가입 실패');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md border-none shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="text-primary-foreground h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>TravelAgent AI와 함께 스마트한 여행을 시작하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full h-11 bg-[#4285F4] hover:bg-[#3574DB] text-white border-none" onClick={() => handleSocialLogin('Google')}>
            Google로 가입
          </Button>
          <Button variant="outline" className="w-full h-11 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] border-none" onClick={() => handleSocialLogin('카카오')}>
            카카오로 가입
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">또는</span></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
            <Input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            <Input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            <Input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" />
            <Button type="submit" className="w-full h-11 rounded-full font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              회원가입
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            이미 계정이 있으신가요?{' '}
            <Link to={ROUTE_PATHS.LOGIN} className="text-primary hover:underline font-medium">로그인</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
