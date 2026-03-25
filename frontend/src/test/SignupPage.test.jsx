import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "../pages/SignupPage";

const mockSignup = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    signup: mockSignup,
    isLoading: false,
  }),
}));

const mockGetCharities = vi.fn();
vi.mock("../services/api", () => ({
  getCharities: () => mockGetCharities(),
}));

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCharities.mockResolvedValue({
      charities: [
        { id: 1, name: "First Tee Youth Development" },
        { id: 2, name: "Golf For Veterans Foundation" },
      ],
    });
    mockSignup.mockResolvedValue({ success: true });
  });

  it("submits normalized charity contribution payload", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    await screen.findByText("First Tee Youth Development");
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Test User");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.selectOptions(screen.getByRole("combobox", { name: "Charity" }), "2");
    await user.clear(screen.getByRole("spinbutton", { name: "Contribution Percentage" }));
    await user.type(screen.getByRole("spinbutton", { name: "Contribution Percentage" }), "25");

    await user.click(screen.getByRole("button", { name: "Signup" }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        expect.objectContaining({
          charityId: 2,
          contributionPercentage: 25,
        })
      );
    });
  });
});
