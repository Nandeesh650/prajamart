const Order = require("../models/order");
const Product = require("../models/product");
const fs = require('fs');
const path = require('path');

// ---------------- ADMIN: UPDATE PRODUCT POSTER ----------------
// This replaces the actual product image file on the server
exports.postUpdateProductPoster = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const image = req.file; 

        if (!image) {
            req.session.adminError = "Please select an image file.";
            return res.redirect("back");
        }

        const product = await Product.findById(productId);
        if (!product) {
            req.session.adminError = "Product not found.";
            return res.redirect("back");
        }

        const existingPhotos = Array.isArray(product.photos) ? [...product.photos] : [];
        const currentPhoto = existingPhotos[0] || product.photo;

        if (currentPhoto) {
            const oldPath = path.join(__dirname, '..', currentPhoto);
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (err) {
                    console.error("Old file delete failed:", err);
                }
            }
        }

        const newPhotoPath = image.path.replace(/\\/g, "/");
        if (existingPhotos.length > 0) {
            existingPhotos[0] = newPhotoPath;
            product.photos = existingPhotos;
        } else {
            product.photos = [newPhotoPath];
        }
        await product.save();

        req.session.adminSuccess = "Product poster updated successfully!";
        res.redirect("back");
    } catch (err) {
        next(err);
    }
};

// ---------------- ADMIN: ABSOLUTE DELETE ORDER ----------------
// Deletes any order regardless of status or date
exports.postAdminDeleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const result = await Order.findByIdAndDelete(orderId);
        
        if (!result) {
            req.session.adminError = "Order already deleted or not found.";
            return res.redirect("back");
        }

        req.session.adminSuccess = "Order permanently removed by Admin.";
        res.redirect("back");
    } catch (err) {
        console.error(err);
        req.session.adminError = "System error during deletion.";
        res.redirect("back");
    }
};

// ---------------- ADMIN: FORCE STATUS UPDATE ----------------
exports.postAdminUpdateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        await Order.findByIdAndUpdate(orderId, { status: status });
        
        req.session.adminSuccess = `Admin forced status to: ${status.toUpperCase()}`;
        res.redirect("back");
    } catch (err) {
        req.session.adminError = "Unable to update order status.";
        res.redirect("back");
    }
};

// ==================== ADMIN AUTHENTICATION & MANAGEMENT ====================

const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const Post = require("../models/post");

const adminLoginValidators = [
  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
];

const postValidators = [
  check("title")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Post title should be at least 3 characters long"),
  check("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Post description should be at least 10 characters long"),
  check("productLink")
    .trim()
    .notEmpty()
    .withMessage("Product link is required")
];

const renderAdminLogin = (res, options = {}) => {
  res.render("admin/login", {
    pageTitle: "Admin Login",
    currentPage: "admin-login",
    isLoggedIn: false,
    errors: options.errors || [],
    success: options.success || "",
    error: options.error || "",
    oldInput: {
      email: options.oldInput?.email || ""
    },
    user: {}
  });
};

const renderAdminDashboard = (res, options = {}) => {
  res.render("admin/dashboard", {
    pageTitle: "Admin Dashboard",
    currentPage: "dashboard",
    isLoggedIn: true,
    user: options.user || {},
    orders: options.orders || [],
    posts: options.posts || [],
    users: options.users || [],
    success: options.success || "",
    error: options.error || "",
    orders_count: options.orders?.length || 0,
    users_count: options.users?.length || 0,
    posts_count: options.posts?.length || 0
  });
};

// Admin Login
exports.getAdminLogin = (req, res) => {
  if (req.session.user?.userType === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  
  const success = req.session.adminSuccess || "";
  const error = req.session.adminError || "";
  delete req.session.adminSuccess;
  delete req.session.adminError;
  
  renderAdminLogin(res, { success, error });
};

exports.postAdminLogin = [
  ...adminLoginValidators,
  async (req, res) => {
    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return renderAdminLogin(res, {
        errors: errors.array().map((err) => err.msg),
        oldInput: { email }
      });
    }

    try {
      console.log('🔍 Searching for admin with email:', email);
      const admin = await User.findOne({ email, userType: 'admin' });

      if (!admin) {
        console.log('❌ No admin found with email:', email);
        console.log('📊 Total admins in DB:', await User.countDocuments({ userType: 'admin' }));
        return renderAdminLogin(res, {
          errors: ["Invalid admin email or credentials"],
          oldInput: { email }
        });
      }

      console.log('✓ Admin found:', admin.email);
      console.log('🔐 Verifying password...');
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        console.log('❌ Password mismatch for:', email);
        return renderAdminLogin(res, {
          errors: ["Invalid password"],
          oldInput: { email }
        });
      }

      console.log('✓ Password verified!');
      req.session.isLoggedIn = true;
      req.session.user = admin;
      await req.session.save();

      console.log('✓ Session saved, redirecting...');
      return res.redirect("/admin/dashboard");
    } catch (err) {
      console.error('❌ Admin login error:', err);
      return renderAdminLogin(res, {
        errors: ["Unable to log in right now. Please try again."],
        oldInput: { email }
      });
    }
  }
];

// Admin Logout
exports.postAdminLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/admin/login');
  });
};

// Create First Admin (Setup Route)
exports.createFirstAdmin = async (req, res) => {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ADMIN SETUP ENDPOINT CALLED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1️⃣  Checking for existing admins...');
    const adminCount = await User.countDocuments({ userType: 'admin' });
    console.log(`   Found: ${adminCount} admins\n`);
    
    if (adminCount > 0) {
      console.log('⚠️  Admin already exists!');
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists',
        admins: adminCount
      });
    }

    console.log('2️⃣  Deleting any old admin records...');
    await User.deleteMany({ email: 'admin@admin.com' });
    console.log('   ✓ Cleaned\n');

    console.log('3️⃣  Hashing password "root"...');
    const hashedPassword = await bcrypt.hash('root', 12);
    console.log('   ✓ Hashed\n');

    console.log('4️⃣  Creating admin user document...');
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@admin.com',
      phoneNumber: '9999999999',
      password: hashedPassword,
      userType: 'admin'
    };
    console.log('   Data:', adminData);

    const admin = new User(adminData);
    console.log('   ✓ Document created\n');

    console.log('5️⃣  Saving to database...');
    const saved = await admin.save();
    console.log('   ✓ Saved with ID:', saved._id, '\n');

    console.log('6️⃣  Verifying in database...');
    const verify = await User.findOne({ email: 'admin@admin.com' });
    if (!verify) {
      throw new Error('Admin saved but not found on verification!');
    }
    console.log('   ✓ Found:', verify.email, '\n');

    console.log('7️⃣  Testing password hash...');
    const testPassword = await bcrypt.compare('root', verify.password);
    console.log('   Password match:', testPassword ? '✓ YES' : '✗ NO', '\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ ADMIN CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return res.status(200).json({
      success: true,
      message: '✓ Admin account created successfully!',
      credentials: {
        email: 'admin@admin.com',
        password: 'root',
        loginUrl: '/admin/login'
      },
      verification: {
        adminFound: !!verify,
        passwordWorks: testPassword,
        id: verify._id
      }
    });

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
};

// Dashboard
exports.getAdminDashboard = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  const success = req.session.adminSuccess || "";
  const error = req.session.adminError || "";
  delete req.session.adminSuccess;
  delete req.session.adminError;

  try {
    const [orders, posts, users] = await Promise.all([
      Order.find()
        .sort({ orderDate: -1 })
        .populate({
          path: "items.productId",
          strictPopulate: false
        })
        .populate("userId", "firstName lastName email phoneNumber"),
      Post.find().populate('createdBy', 'firstName lastName email'),
      User.find({ userType: { $ne: 'admin' } }).select('firstName lastName email phoneNumber userType')
    ]);

    renderAdminDashboard(res, {
      user: req.session.user,
      orders,
      posts,
      users,
      success,
      error
    });
  } catch (err) {
    renderAdminDashboard(res, {
      user: req.session.user,
      orders: [],
      error: "Unable to load dashboard"
    });
  }
};

// ===== POST MANAGEMENT =====

// Get all posts
exports.getAllPosts = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  try {
    const posts = await Post.find().populate('createdBy', 'firstName lastName email').sort({ createdAt: -1 });
    res.render("admin/posts", {
      pageTitle: "Manage Posts",
      currentPage: "posts",
      isLoggedIn: true,
      user: req.session.user,
      posts,
      success: req.session.adminSuccess || "",
      error: req.session.adminError || ""
    });

    delete req.session.adminSuccess;
    delete req.session.adminError;
  } catch (err) {
    res.render("admin/posts", {
      pageTitle: "Manage Posts",
      currentPage: "posts",
      isLoggedIn: true,
      user: req.session.user,
      posts: [],
      error: "Unable to load posts"
    });
  }
};

// Get add post form
exports.getAddPost = (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  res.render("admin/add-post", {
    pageTitle: "Create Post",
    currentPage: "add-post",
    isLoggedIn: true,
    user: req.session.user,
    errors: [],
    oldInput: {}
  });
};

// Create post
exports.postAddPost = [
  ...postValidators,
  async (req, res) => {
    if (req.session.user?.userType !== 'admin') {
      return res.redirect('/admin/login');
    }

    const { title, description, productLink } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("admin/add-post", {
        pageTitle: "Create Post",
        currentPage: "add-post",
        isLoggedIn: true,
        user: req.session.user,
        errors: errors.array().map((err) => err.msg),
        oldInput: { title, description, productLink }
      });
    }

    if (!req.file) {
      return res.render("admin/add-post", {
        pageTitle: "Create Post",
        currentPage: "add-post",
        isLoggedIn: true,
        user: req.session.user,
        errors: ["Please upload an image"],
        oldInput: { title, description, productLink }
      });
    }

    try {
      const post = new Post({
        title,
        description,
        productLink,
        imageUrl: `/uploads/${req.file.filename}`,
        createdBy: req.session.user._id
      });

      await post.save();

      req.session.adminSuccess = "Post created successfully!";
      return res.redirect('/admin/posts');
    } catch (err) {
      return res.render("admin/add-post", {
        pageTitle: "Create Post",
        currentPage: "add-post",
        isLoggedIn: true,
        user: req.session.user,
        errors: ["Unable to create post"],
        oldInput: { title, description, productLink }
      });
    }
  }
];

// Get edit post form
exports.getEditPost = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.redirect('/admin/posts');
    }

    res.render("admin/edit-post", {
      pageTitle: "Edit Post",
      currentPage: "edit-post",
      isLoggedIn: true,
      user: req.session.user,
      post,
      errors: [],
      oldInput: {}
    });
  } catch (err) {
    return res.redirect('/admin/posts');
  }
};

// Update post
exports.postEditPost = [
  ...postValidators,
  async (req, res) => {
    if (req.session.user?.userType !== 'admin') {
      return res.redirect('/admin/login');
    }

    const { postId } = req.params;
    const { title, description, productLink } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const post = await Post.findById(postId);
      return res.render("admin/edit-post", {
        pageTitle: "Edit Post",
        currentPage: "edit-post",
        isLoggedIn: true,
        user: req.session.user,
        post,
        errors: errors.array().map((err) => err.msg),
        oldInput: { title, description, productLink }
      });
    }

    try {
      const post = await Post.findById(postId);

      if (!post) {
        return res.redirect('/admin/posts');
      }

      post.title = title;
      post.description = description;
      post.productLink = productLink;

      if (req.file) {
        post.imageUrl = `/uploads/${req.file.filename}`;
      }

      post.updatedAt = new Date();
      await post.save();

      req.session.adminSuccess = "Post updated successfully!";
      return res.redirect('/admin/posts');
    } catch (err) {
      const post = await Post.findById(postId);
      return res.render("admin/edit-post", {
        pageTitle: "Edit Post",
        currentPage: "edit-post",
        isLoggedIn: true,
        user: req.session.user,
        post,
        errors: ["Unable to update post"],
        oldInput: { title, description, productLink }
      });
    }
  }
];

// Delete post
exports.postDeletePost = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  const { postId } = req.params;

  try {
    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      req.session.adminError = "Post not found";
      return res.redirect('/admin/posts');
    }

    req.session.adminSuccess = "Post deleted successfully!";
    return res.redirect('/admin/posts');
  } catch (err) {
    req.session.adminError = "Unable to delete post";
    return res.redirect('/admin/posts');
  }
};

// ===== USER MANAGEMENT =====

// Get all users
exports.getAllUsers = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  try {
    const users = await User.find({ userType: { $ne: 'admin' } }).select('firstName lastName email phoneNumber userType');

    res.render("admin/users", {
      pageTitle: "Manage Users",
      currentPage: "users",
      isLoggedIn: true,
      user: req.session.user,
      users,
      success: req.session.adminSuccess || "",
      error: req.session.adminError || ""
    });

    delete req.session.adminSuccess;
    delete req.session.adminError;
  } catch (err) {
    res.render("admin/users", {
      pageTitle: "Manage Users",
      currentPage: "users",
      isLoggedIn: true,
      user: req.session.user,
      users: [],
      error: "Unable to load users"
    });
  }
};

// Get edit user form
exports.getEditUser = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  const { userId } = req.params;

  try {
    const editUser = await User.findById(userId);

    if (!editUser || editUser.userType === 'admin') {
      return res.redirect('/admin/users');
    }

    res.render("admin/edit-user", {
      pageTitle: "Edit User",
      currentPage: "edit-user",
      isLoggedIn: true,
      user: req.session.user,
      editUser,
      errors: [],
      oldInput: {}
    });
  } catch (err) {
    return res.redirect('/admin/users');
  }
};

// Update user
exports.postEditUser = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  const { userId } = req.params;
  const { firstName, lastName, email, phoneNumber, userType } = req.body;

  try {
    const editUser = await User.findById(userId);

    if (!editUser || editUser.userType === 'admin') {
      return res.redirect('/admin/users');
    }

    editUser.firstName = firstName || editUser.firstName;
    editUser.lastName = lastName || editUser.lastName;
    editUser.email = email || editUser.email;
    editUser.phoneNumber = phoneNumber || editUser.phoneNumber;
    editUser.userType = userType || editUser.userType;

    await editUser.save();

    req.session.adminSuccess = "User updated successfully!";
    return res.redirect('/admin/users');
  } catch (err) {
    const editUser = await User.findById(userId);
    return res.render("admin/edit-user", {
      pageTitle: "Edit User",
      currentPage: "edit-user",
      isLoggedIn: true,
      user: req.session.user,
      editUser,
      errors: ["Unable to update user"],
      oldInput: { firstName, lastName, email, phoneNumber, userType }
    });
  }
};

// Delete user
exports.postDeleteUser = async (req, res) => {
  if (req.session.user?.userType !== 'admin') {
    return res.redirect('/admin/login');
  }

  const { userId } = req.params;

  try {
    const userToDelete = await User.findById(userId);

    if (!userToDelete || userToDelete.userType === 'admin') {
      req.session.adminError = "Cannot delete this user";
      return res.redirect('/admin/users');
    }

    await User.findByIdAndDelete(userId);

    req.session.adminSuccess = "User deleted successfully!";
    return res.redirect('/admin/users');
  } catch (err) {
    req.session.adminError = "Unable to delete user";
    return res.redirect('/admin/users');
  }
};
