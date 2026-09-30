import { Alert, Button, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { toast } from '@/core/lib/toast';
import { useUpdateProfile } from '@/features/users';
import { profileSchema } from '../schemas/profileSchema';

export function ProfileForm({ user }) {
  const updateProfile = useUpdateProfile();
  const { form, submit, formError, isSubmitting } = useFormMutation({
    schema: profileSchema,
    mutation: updateProfile,
    defaultValues: { name: user.name ?? '', avatarUrl: user.avatarUrl ?? '' },
    onSuccess: (_user, values) => {
      form.reset(values); // giá trị mới thành "mặc định" -> nút Lưu tắt lại
      toast.success('Đã cập nhật hồ sơ');
    },
  });
  const {
    register,
    formState: { errors, isDirty },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <TextField label="Email" value={user.email} disabled readOnly name="email-readonly" />
      <TextField label="Họ tên" error={errors.name?.message} {...register('name')} />
      <TextField
        label="Ảnh đại diện (URL)"
        type="url"
        placeholder="https://..."
        error={errors.avatarUrl?.message}
        {...register('avatarUrl')}
      />
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        Lưu hồ sơ
      </Button>
    </form>
  );
}
