import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  title = 'Xác nhận',
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{description}</p>
    </Modal>
  );
}
