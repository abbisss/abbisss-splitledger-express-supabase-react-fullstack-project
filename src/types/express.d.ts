// Used to get rid of type script type error only
// Allows us to add custom properties to Express types globally
declare global {

  // Access Express namespace types
  namespace Express {

    // Extend the default Express Request object
    interface Request {

      // Add a user property that will be added by authMiddleware
      user?: {

        // The Supabase user ID
        id: string;

        // The user's email (optional)
        email?: string;
      };
    }
  }
}

// Makes this file a module so TypeScript applies the global extension correctly
export {};