import * as React from 'react';
import {
  describe, expect, it,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  LayoutProvider,
  useLayoutContext,
} from '../../../../../src/plugin-pip/components/contexts/layout';
import { PipWindowProvider } from '../../../../../src/plugin-pip/components/contexts/pip-window';

function FocusState() {
  const { contentFocused } = useLayoutContext();
  return <span>{contentFocused ? 'focused' : 'unfocused'}</span>;
}

interface LayoutHarnessProps {
  hasPresentation: boolean;
}

function LayoutHarness({ hasPresentation }: LayoutHarnessProps) {
  return (
    <PipWindowProvider pipWindow={window}>
      <LayoutProvider
        hasCameras
        hasScreenshare={false}
        hasPresentation={hasPresentation}
        presenter
        moderator
      >
        <FocusState />
      </LayoutProvider>
    </PipWindowProvider>
  );
}

describe('LayoutProvider', () => {
  it('restores the initial focus after content returns', async () => {
    const { rerender } = render(<LayoutHarness hasPresentation />);

    await screen.findByText('focused');

    rerender(<LayoutHarness hasPresentation={false} />);
    await screen.findByText('unfocused');

    rerender(<LayoutHarness hasPresentation />);
    await waitFor(() => expect(screen.getByText('focused')).toBeInTheDocument());
  });
});
