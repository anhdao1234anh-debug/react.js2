import { useCallback, useState } from 'react';

/**
 * Quản lý trạng thái mở/đóng (modal, dropdown, confirm...) kèm dữ liệu đi kèm.
 * @example const modal = useDisclosure(); modal.open(product); modal.data // product
 */
export function useDisclosure(initialOpen = false) {
  const [state, setState] = useState({ isOpen: initialOpen, data: null });

  const open = useCallback((data = null) => setState({ isOpen: true, data }), []);
  const close = useCallback(() => setState({ isOpen: false, data: null }), []);
  const toggle = useCallback(() => setState((prev) => ({ isOpen: !prev.isOpen, data: null })), []);

  return { isOpen: state.isOpen, data: state.data, open, close, toggle };
}
