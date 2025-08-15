import { render, screen, fireEvent } from '@testing-library/react';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import Home from '../app/page';

// Mock Auth0
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: {
      sub: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
    error: null,
    isLoading: false,
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock TRPC
jest.mock('../app/providers/trpc-provider', () => ({
  trpc: {
    getMessages: {
      useQuery: () => ({ data: [] }),
    },
    sendMessage: {
      useMutation: () => ({
        mutateAsync: jest.fn(),
        isLoading: false,
      }),
    },
    clearMessages: {
      useMutation: () => ({
        mutate: jest.fn(),
        isLoading: false,
      }),
    },
    useUtils: () => ({
      getMessages: {
        invalidate: jest.fn(),
      },
    }),
  },
  TRPCProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Bootstrap components to avoid complex rendering issues
jest.mock('react-bootstrap', () => ({
  Container: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Row: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Col: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Form: ({ children, onSubmit, ...props }: any) => (
    <form onSubmit={onSubmit} {...props}>{children}</form>
  ),
  InputGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Navbar: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  Nav: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

const TRPCProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe('Home Page', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <UserProvider>
        <TRPCProvider>
          {component}
        </TRPCProvider>
      </UserProvider>
    );
  };

  it('renders welcome message when no messages', () => {
    renderWithProviders(<Home />);
    
    const welcomeElement = screen.getByText('Welcome to ChatGPT Clone');
    const instructionElement = screen.getByText('Start a conversation by typing a message below');
    
    expect(welcomeElement).toBeDefined();
    expect(instructionElement).toBeDefined();
  });

  it('renders message input and send button', () => {
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');
    
    expect(input).toBeDefined();
    expect(sendButton).toBeDefined();
  });

  it('toggles between text and image mode', () => {
    renderWithProviders(<Home />);
    
    const toggleButton = screen.getByText('💬 TXT');
    fireEvent.click(toggleButton);
    
    const imageButton = screen.getByText('🖼️ IMG');
    const imagePlaceholder = screen.getByPlaceholderText('Describe an image to generate...');
    
    expect(imageButton).toBeDefined();
    expect(imagePlaceholder).toBeDefined();
  });

  it('disables send button when message is empty', () => {
    renderWithProviders(<Home />);
    
    const sendButton = screen.getByText('Send') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
  });

  it('enables send button when message is typed', () => {
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send') as HTMLButtonElement;
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    expect(sendButton.disabled).toBe(false);
  });
});