
export const allowRoles = (...roles) => (req, res, next) => {
  console.log("========== ROLE CHECK ==========");
  console.log("URL:", req.originalUrl);
  console.log("METHOD:", req.method);
  console.log("Allowed roles:", JSON.stringify(roles));
  console.log("Actual role:", req.user?.role);
  console.log("================================");

  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission for this action",
      debug: {
        url: req.originalUrl,
        userRole: req.user?.role,
        allowedRoles: roles
      }
    });
  }

  next();
};
