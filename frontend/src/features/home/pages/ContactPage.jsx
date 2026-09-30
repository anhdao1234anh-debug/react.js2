import { z } from 'zod';
import { Button, Card, CardBody, TextareaField, TextField } from '@/core/components/ui';
import { useFormMutation } from '@/core/hooks/useFormMutation';
import { toast } from '@/core/lib/toast';
import { emailSchema, nameSchema } from '@/core/validation/common';

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string().trim().min(10, 'Nội dung tối thiểu 10 ký tự').max(2000),
});

// Demo: chưa có API liên hệ -> giả lập gửi. Phase Mail có thể thêm endpoint /contact.
const fakeSend = () => new Promise((resolve) => setTimeout(resolve, 400));

export default function ContactPage() {
  const { form, submit, isSubmitting } = useFormMutation({
    schema: contactSchema,
    mutationFn: fakeSend,
    defaultValues: { name: '', email: '', message: '' },
    resetOnSuccess: true,
    onSuccess: () => toast.success('Đã gửi liên hệ', 'Chúng tôi sẽ phản hồi sớm nhất.'),
  });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Liên hệ</h1>
      <Card>
        <CardBody>
          <form onSubmit={submit} noValidate className="space-y-4">
            <TextField label="Họ tên" error={errors.name?.message} {...register('name')} />
            <TextField
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextareaField
              label="Nội dung"
              rows={5}
              error={errors.message?.message}
              {...register('message')}
            />
            <Button type="submit" loading={isSubmitting}>
              Gửi liên hệ
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
