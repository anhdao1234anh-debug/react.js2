import { buttonVariants } from '@/core/components/ui';
import { authApi } from '../api/authApi';
import { useAuthProviders } from '../hooks/useAuthMutations';

const PROVIDER_LABELS = {
  google: 'Tiếp tục với Google',
  github: 'Tiếp tục với GitHub',
};

/** Nút đăng nhập mạng xã hội - chỉ hiện provider mà backend đã cấu hình. */
export function OAuthButtons({ redirectTo }) {
  const { data } = useAuthProviders();
  const providers = data?.oauth ?? [];
  if (providers.length === 0) return null;

  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <a
          key={provider}
          href={authApi.getOAuthUrl(provider, redirectTo)}
          className={buttonVariants({ variant: 'secondary', className: 'w-full' })}
        >
          {PROVIDER_LABELS[provider] ?? `Tiếp tục với ${provider}`}
        </a>
      ))}
    </div>
  );
}
