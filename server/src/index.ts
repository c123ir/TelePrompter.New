import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import { Project, ProjectManager } from './models/Project';

// بارگذاری متغیرهای محیطی
dotenv.config();

// تنظیمات پورت
const PORT = process.env.PORT || 4444;
const HOST = process.env.HOST || '0.0.0.0';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3333';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// راه‌اندازی پروژه‌های نمونه
const projectManager = new ProjectManager();

// ایجاد پروژه نمونه برای تست
const demoProject = projectManager.createProject('پروژه نمونه');
demoProject.text = 'این یک متن نمونه برای تست تله‌پرامپتر است. این متن می‌تواند توسط کاربر تغییر داده شود.';
console.log(`پروژه نمونه با آیدی ${demoProject.id} ایجاد شد`);

// راه‌اندازی اکسپرس
const app = express();

// پیکربندی CORS با تنظیمات دقیق‌تر
const corsOptions = {
  origin: [
    'http://localhost:3333', 
    'http://127.0.0.1:3333',
    CLIENT_URL,
    // اضافه کردن آدرس‌های دیگر برای دسترسی از شبکه
    /^http:\/\/192\.168\.\d+\.\d+:3333$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:3333$/,
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:3333$/,
    // برای ویژگی پرادکشن، اما ناامن برای محیط واقعی تولید
    '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
};

app.use(cors(corsOptions));

// کلاس مدیریت اتصالات
class ConnectionManager {
  private connections: Map<string, Socket> = new Map();
  
  addConnection(socket: Socket): void {
    this.connections.set(socket.id, socket);
    console.log(`اتصال جدید: ${socket.id} (تعداد کل: ${this.connections.size})`);
  }
  
  removeConnection(socketId: string): void {
    this.connections.delete(socketId);
    console.log(`اتصال قطع شد: ${socketId} (تعداد کل: ${this.connections.size})`);
  }
  
  getConnectionCount(): number {
    return this.connections.size;
  }
  
  getConnectionInfo(): { count: number; connectionIds: string[] } {
    return {
      count: this.connections.size,
      connectionIds: Array.from(this.connections.keys())
    };
  }

  getSocket(socketId: string): Socket | undefined {
    return this.connections.get(socketId);
  }

  broadcastToAll(event: string, data: any): void {
    this.connections.forEach((socket) => {
      socket.emit(event, data);
    });
  }

  broadcastToRoom(room: string, event: string, data: any): void {
    this.connections.forEach((socket) => {
      socket.to(room).emit(event, data);
    });
  }
}

// ایجاد مدیر اتصالات
const connectionManager = new ConnectionManager();

// تنظیم مسیرهای API

// دریافت لیست پروژه‌ها
app.get('/api/projects', (req, res) => {
  const projects = projectManager.getAllProjects();
  res.json(projects);
});

// دریافت اطلاعات یک پروژه
app.get('/api/projects/:id', (req, res) => {
  const project = projectManager.getProject(req.params.id);
  if (project) {
    res.json(project);
  } else {
    res.status(404).json({ error: 'پروژه یافت نشد' });
  }
});

// تنظیم صفحه شاخص
app.get('/', (req, res) => {
  res.send(`
    <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>سرور تله‌پرامپتر</title>
        <style>
          body {
            font-family: 'Tahoma', sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            background-color: #f7f9fc;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #2c3e50;
            margin-top: 0;
          }
          .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: bold;
          }
          .online {
            background-color: #d4edda;
            color: #155724;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .info-table th, .info-table td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #eee;
          }
          .info-table th {
            background-color: #f8f9fa;
          }
          .projects-list {
            margin-top: 30px;
          }
          .project-card {
            background-color: #f8f9fa;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 3px solid #007bff;
          }
          .project-title {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
          }
          .project-info {
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>سرور تله‌پرامپتر</h1>
          <div>
            <span class="status online">فعال</span>
          </div>
          <table class="info-table">
            <tr>
              <th>پورت سرور</th>
              <td>${PORT}</td>
            </tr>
            <tr>
              <th>آدرس کلاینت</th>
              <td>${CLIENT_URL}</td>
            </tr>
            <tr>
              <th>محیط اجرا</th>
              <td>${ENVIRONMENT}</td>
            </tr>
            <tr>
              <th>تعداد اتصالات فعال</th>
              <td>${connectionManager.getConnectionCount()}</td>
            </tr>
            <tr>
              <th>تعداد پروژه‌ها</th>
              <td>${projectManager.getAllProjects().length}</td>
            </tr>
            <tr>
              <th>آدرس IP سرور</th>
              <td>${getLocalIpAddress()}</td>
            </tr>
            <tr>
              <th>زمان شروع سرور</th>
              <td>${new Date().toLocaleString('fa-IR')}</td>
            </tr>
          </table>
          
          <div class="projects-list">
            <h2>پروژه‌های موجود</h2>
            ${projectManager.getAllProjects().map(project => `
              <div class="project-card">
                <div class="project-title">${project.name}</div>
                <div class="project-info">
                  شناسه: ${project.id}<br>
                  کاربران متصل: ${project.clientCount}<br>
                  آخرین به‌روزرسانی: ${new Date(project.updatedAt).toLocaleString('fa-IR')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
    </html>
  `);
});

// اطلاعات API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    connections: connectionManager.getConnectionInfo(),
    projects: projectManager.getAllProjects(),
    server: {
      port: PORT,
      environment: ENVIRONMENT,
      ip: getLocalIpAddress(),
      startTime: new Date().toISOString()
    }
  });
});

// ایجاد سرور HTTP و Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    // استفاده از همان تنظیمات CORS برای Socket.IO
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: true,
    allowedHeaders: corsOptions.allowedHeaders
  },
  // افزایش مدت زمان انتظار برای اتصال
  pingTimeout: 60000,
  pingInterval: 25000,
  // تنظیمات اضافی
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// مدیریت خطاهای سراسری
process.on('uncaughtException', (error) => {
  console.error('خطای مدیریت نشده:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('وعده رد شده مدیریت نشده:', promise, 'دلیل:', reason);
});

// بهبود تابع تشخیص آدرس IP محلی
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  let ipAddress = '127.0.0.1';
  
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    if (!networkInterface) continue;
    
    for (const iface of networkInterface) {
      // فقط آدرس‌های IPv4 غیر لوکال را بررسی می‌کنیم
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
        return ipAddress; // اولین آدرس IP معتبر را برمی‌گردانیم
      }
    }
  }
  
  return ipAddress;
}

// مدیریت اتصالات Socket.io
io.on('connection', (socket) => {
  // اضافه کردن اتصال به مدیر
  connectionManager.addConnection(socket);
  
  // بررسی نقش کاربر (کنترل‌کننده یا نمایش‌دهنده)
  const userRole = socket.handshake.query.role || 'viewer';
  
  console.log(`کاربر جدید متصل شد: ${socket.id} با نقش: ${userRole}`);
  
  // ارسال اطلاعات به همه کلاینت‌ها
  io.emit('connection-count', connectionManager.getConnectionCount());
  
  // ارسال لیست پروژه‌ها به کلاینت جدید
  socket.emit('projects-list', projectManager.getAllProjects());

  // درخواست ایجاد پروژه جدید
  socket.on('create-project', (data: { name: string, text: string }) => {
    console.log(`درخواست ایجاد پروژه جدید از کاربر ${socket.id}:`, data);
    
    try {
      // بررسی داده‌های ورودی
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'داده‌های نامعتبر برای ایجاد پروژه' });
        return;
      }
      
      const { name, text } = data;
      
      if (!name || typeof name !== 'string') {
        socket.emit('error', { message: 'نام پروژه نامعتبر است' });
        return;
      }
      
      // ایجاد پروژه جدید
      const newProject = projectManager.createProject(name, text || 'متن پیش‌فرض تله‌پرامپتر...');
      
      // ارسال اطلاعات پروژه جدید به کلاینت
      socket.emit('project-created', newProject);
      
      // به‌روزرسانی لیست پروژه‌ها برای همه کاربران
      io.emit('projects-list', projectManager.getAllProjects());
      
      console.log(`پروژه جدید با نام "${name}" و شناسه ${newProject.id} توسط کاربر ${socket.id} ایجاد شد`);
    } catch (error) {
      console.error(`خطا در ایجاد پروژه جدید:`, error);
      socket.emit('error', { message: 'خطا در ایجاد پروژه جدید' });
    }
  });

  // درخواست لیست پروژه‌ها
  socket.on('get-projects', () => {
    console.log(`کاربر ${socket.id} درخواست لیست پروژه‌ها را دارد`);
    const projects = projectManager.getAllProjects();
    socket.emit('projects-list', projects);
    console.log(`لیست ${projects.length} پروژه برای کاربر ${socket.id} ارسال شد`);
  });

  // درخواست اطلاعات یک پروژه
  socket.on('get-project', (projectId: string) => {
    console.log(`کاربر ${socket.id} درخواست اطلاعات پروژه ${projectId} را دارد`);
    
    if (!projectId) {
      console.error(`شناسه پروژه نامعتبر از کاربر ${socket.id}`);
      socket.emit('error', { message: 'شناسه پروژه نامعتبر است' });
      return;
    }
    
    const project = projectManager.getProject(projectId);
    if (project) {
      socket.emit('project-data', project);
      console.log(`اطلاعات پروژه ${projectId} برای کاربر ${socket.id} ارسال شد`);
    } else {
      socket.emit('error', { message: 'پروژه مورد نظر یافت نشد' });
      console.error(`پروژه ${projectId} یافت نشد برای کاربر ${socket.id}`);
    }
  });

  // پیوستن به یک پروژه
  socket.on('join-project', (data: any) => {
    console.log(`داده‌های دریافتی برای پیوستن به پروژه:`, data);
    
    // بررسی اگر داده‌ها به صورت رشته باشد (آیدی پروژه مستقیم)
    let projectId: string;
    let role: 'controller' | 'viewer' = 'viewer'; // مقدار پیش‌فرض
    
    if (typeof data === 'string') {
      projectId = data;
      role = socket.handshake.query.role as 'controller' | 'viewer' || 'viewer';
    } 
    // بررسی اگر داده‌ها به صورت آبجکت باشد
    else if (data && typeof data === 'object') {
      projectId = data.projectId;
      role = data.role || socket.handshake.query.role as 'controller' | 'viewer' || 'viewer';
    } else {
      console.error(`داده‌های نامعتبر برای پیوستن به پروژه از کاربر ${socket.id}:`, data);
      socket.emit('error', { message: 'اطلاعات نامعتبر برای پیوستن به پروژه' });
      return;
    }
    
    if (!projectId) {
      console.error(`شناسه پروژه نامعتبر از کاربر ${socket.id}`);
      socket.emit('error', { message: 'شناسه پروژه نامعتبر است' });
      return;
    }
    
    console.log(`درخواست پیوستن به پروژه ${projectId} از کاربر: ${socket.id} با نقش: ${role}`);
    
    // بررسی اینکه آیا کاربر قبلاً به پروژه‌ای متصل بوده است
    const currentProject = projectManager.findProjectByClientId(socket.id);
    if (currentProject && currentProject.id !== projectId) {
      // ترک پروژه قبلی
      socket.leave(currentProject.id);
      projectManager.removeClientFromProject(currentProject.id, socket.id);
      socket.to(currentProject.id).emit('client-left', { 
        projectId: currentProject.id, 
        clientId: socket.id,
        role
      });
    }

    // اتصال به پروژه جدید
    const project = projectManager.getProject(projectId);
    if (project) {
      socket.join(projectId);
      
      // اضافه کردن متادیتا به socket برای مشخص کردن نقش
      socket.data.role = role;
      socket.data.projectId = projectId;
      
      projectManager.addClientToProject(projectId, socket.id);
      
      // ارسال اطلاعات پروژه به کلاینت
      socket.emit('project-data', project);
      console.log(`اطلاعات پروژه ${projectId} برای کاربر ${socket.id} ارسال شد`);
      
      // اطلاع‌رسانی به سایر اعضای پروژه
      socket.to(projectId).emit('client-joined', { 
        projectId, 
        clientId: socket.id,
        role
      });
      
      // اگر نقش کاربر نمایش‌دهنده است، به کنترل‌کننده‌ها اطلاع دهیم
      if (role === 'viewer') {
        // پیدا کردن کنترل‌کننده‌های این پروژه و اطلاع‌رسانی به آنها
        updateViewerCount(projectId);
      }
      
      console.log(`کاربر ${socket.id} به پروژه ${projectId} پیوست با نقش ${role}`);
    } else {
      socket.emit('error', { message: 'پروژه مورد نظر یافت نشد' });
      console.error(`پروژه ${projectId} یافت نشد برای کاربر ${socket.id}`);
    }
  });

  // ترک یک پروژه
  socket.on('leave-project', (data: { projectId: string, role: 'controller' | 'viewer' }) => {
    const { projectId, role } = data;
    
    socket.leave(projectId);
    projectManager.removeClientFromProject(projectId, socket.id);
    
    socket.to(projectId).emit('client-left', { 
      projectId, 
      clientId: socket.id,
      role
    });
    
    // اگر نقش کاربر نمایش‌دهنده است، به کنترل‌کننده‌ها اطلاع دهیم
    if (role === 'viewer') {
      updateViewerCount(projectId);
    }
    
    console.log(`کاربر ${socket.id} پروژه ${projectId} را ترک کرد با نقش ${role}`);
  });

  // ویرایش پروژه
  socket.on('edit-project', (data: { projectId: string, name?: string, text?: string }) => {
    console.log(`درخواست ویرایش پروژه از کاربر ${socket.id}:`, data);
    
    try {
      const { projectId, name, text } = data;
      
      if (!projectId) {
        socket.emit('error', { message: 'شناسه پروژه نامعتبر است' });
        return;
      }
      
      const project = projectManager.getProject(projectId);
      if (!project) {
        socket.emit('error', { message: 'پروژه مورد نظر یافت نشد' });
        return;
      }
      
      // ایجاد آبجکت تغییرات
      const updates: Partial<Project> = {};
      if (name) updates.name = name;
      if (text !== undefined) updates.text = text;
      
      // به‌روزرسانی پروژه
      projectManager.updateProject(projectId, updates);
      
      // ارسال اطلاعات به‌روز شده به کلاینت
      socket.emit('project-updated', projectManager.getProject(projectId));
      
      // به‌روزرسانی لیست پروژه‌ها برای همه کاربران
      io.emit('projects-list', projectManager.getAllProjects());
      
      // ارسال اطلاعات به‌روز شده به همه اعضای پروژه
      io.to(projectId).emit('project-data', projectManager.getProject(projectId));
      
      console.log(`پروژه ${projectId} توسط کاربر ${socket.id} ویرایش شد`);
    } catch (error) {
      console.error(`خطا در ویرایش پروژه:`, error);
      socket.emit('error', { message: 'خطا در ویرایش پروژه' });
    }
  });
  
  // حذف پروژه
  socket.on('delete-project', (projectId: string) => {
    console.log(`درخواست حذف پروژه ${projectId} از کاربر ${socket.id}`);
    
    try {
      if (!projectId) {
        socket.emit('error', { message: 'شناسه پروژه نامعتبر است' });
        return;
      }
      
      const project = projectManager.getProject(projectId);
      if (!project) {
        socket.emit('error', { message: 'پروژه مورد نظر یافت نشد' });
        return;
      }
      
      // اطلاع‌رسانی به کاربران متصل به این پروژه
      io.to(projectId).emit('project-deleted', projectId);
      
      // حذف پروژه
      projectManager.deleteProject(projectId);
      
      // ارسال تأیید حذف به کلاینت
      socket.emit('project-delete-confirmed', projectId);
      
      // به‌روزرسانی لیست پروژه‌ها برای همه کاربران
      io.emit('projects-list', projectManager.getAllProjects());
      
      console.log(`پروژه ${projectId} توسط کاربر ${socket.id} حذف شد`);
    } catch (error) {
      console.error(`خطا در حذف پروژه:`, error);
      socket.emit('error', { message: 'خطا در حذف پروژه' });
    }
  });

  // درخواست تغییر تنظیمات پروژه
  socket.on('update-project-settings', (data: { projectId: string, settings: Partial<Project> }) => {
    const { projectId, settings } = data;
    const project = projectManager.getProject(projectId);
    
    if (project) {
      // به‌روزرسانی تنظیمات پروژه
      projectManager.updateProject(projectId, settings);
      
      // ارسال تنظیمات به‌روز شده به همه اعضای پروژه
      io.to(projectId).emit('project-settings-updated', { projectId, settings });
      
      console.log(`تنظیمات پروژه ${projectId} توسط ${socket.id} به‌روز شد`);
    } else {
      socket.emit('error', { message: 'پروژه مورد نظر یافت نشد' });
    }
  });

  // درخواست شروع اسکرول
  socket.on('start-scrolling', (projectId: string) => {
    const project = projectManager.getProject(projectId);
    if (project) {
      project.startScrolling();
      io.to(projectId).emit('scrolling-started', projectId);
      console.log(`اسکرول پروژه ${projectId} توسط ${socket.id} شروع شد`);
    }
  });

  // درخواست توقف اسکرول
  socket.on('stop-scrolling', (projectId: string) => {
    const project = projectManager.getProject(projectId);
    if (project) {
      project.stopScrolling();
      io.to(projectId).emit('scrolling-stopped', projectId);
      console.log(`اسکرول پروژه ${projectId} توسط ${socket.id} متوقف شد`);
    }
  });

  // درخواست شمارش معکوس
  socket.on('start-countdown', (data: { projectId: string, seconds: number }) => {
    const { projectId, seconds } = data;
    const project = projectManager.getProject(projectId);
    
    if (project) {
      // ارسال شروع شمارش معکوس به همه اعضای پروژه
      io.to(projectId).emit('countdown-started', { projectId, seconds });
      
      // تنظیم تایمر برای شمارش معکوس
      let remainingSeconds = seconds;
      const countdownInterval = setInterval(() => {
        remainingSeconds -= 1;
        
        if (remainingSeconds <= 0) {
          // پایان شمارش معکوس
          clearInterval(countdownInterval);
          io.to(projectId).emit('countdown-finished', projectId);
          
          // شروع اسکرول پس از پایان شمارش معکوس
          project.startScrolling();
          io.to(projectId).emit('scrolling-started', projectId);
        }
      }, 1000);
      
      console.log(`شمارش معکوس برای پروژه ${projectId} با ${seconds} ثانیه توسط ${socket.id} شروع شد`);
    }
  });

  // تغییر متن پروژه
  socket.on('update-text', (data: { projectId: string, text: string }) => {
    const { projectId, text } = data;
    const project = projectManager.getProject(projectId);
    
    if (project) {
      project.text = text;
      project.updatedAt = new Date();
      
      // ارسال متن به‌روز شده به همه اعضای پروژه
      io.to(projectId).emit('text-updated', { projectId, text });
      
      console.log(`متن پروژه ${projectId} توسط ${socket.id} به‌روز شد`);
    }
  });
  
  // تنظیم موقعیت اسکرول
  socket.on('set-scroll-position', (data: { projectId: string, position: number }) => {
    const { projectId, position } = data;
    const project = projectManager.getProject(projectId);
    
    if (project) {
      project.startPosition = position;
      
      // ارسال موقعیت جدید به همه اعضای پروژه
      io.to(projectId).emit('set-scroll-position', { projectId, position });
      
      console.log(`موقعیت اسکرول پروژه ${projectId} به ${position} توسط ${socket.id} تغییر کرد`);
    }
  });

  // مدیریت پینگ/پونگ برای تست اتصال
  socket.on('ping', (callback) => {
    // اگر callback تابع باشد، آن را فراخوانی کنید
    if (typeof callback === 'function') {
      callback();
    } else {
      // اگر callback وجود نداشت، پاسخ pong را ارسال کنید
      socket.emit('pong', Date.now());
    }
  });

  // مدیریت خطاها
  socket.on('error', (error) => {
    console.error(`خطای سوکت برای ${socket.id}:`, error);
  });

  // قطع اتصال کاربر
  socket.on('disconnect', (reason) => {
    // یافتن پروژه‌ای که کاربر در آن بود
    const project = projectManager.findProjectByClientId(socket.id);
    if (project) {
      // حذف کاربر از پروژه
      projectManager.removeClientFromProject(project.id, socket.id);
      
      // اطلاع‌رسانی به سایرین
      socket.to(project.id).emit('client-left', { 
        projectId: project.id, 
        clientId: socket.id,
        role: socket.data.role || 'viewer'
      });
      
      // اگر کاربر نمایش‌دهنده بود، به‌روزرسانی تعداد بیننده‌ها
      if (socket.data.role === 'viewer') {
        updateViewerCount(project.id);
      }
      
      console.log(`کاربر ${socket.id} از پروژه ${project.id} جدا شد با نقش ${socket.data.role || 'نامشخص'} (دلیل: ${reason})`);
    }
    
    // حذف اتصال از مدیر
    connectionManager.removeConnection(socket.id);
    
    console.log(`کاربر قطع اتصال کرد: ${socket.id}، دلیل: ${reason}`);
    
    // ارسال اطلاعات به‌روز شده به همه کلاینت‌ها
    io.emit('connection-count', connectionManager.getConnectionCount());
  });
});

// به‌روزرسانی تعداد بیننده‌ها برای یک پروژه
function updateViewerCount(projectId: string) {
  // شمارش تعداد کلاینت‌های با نقش viewer در این پروژه
  let viewerCount = 0;
  const sockets = io.sockets.adapter.rooms.get(projectId);
  
  if (sockets) {
    // بررسی هر سوکت در این اتاق
    for (const socketId of sockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.data.role === 'viewer') {
        viewerCount++;
      }
    }
  }
  
  // ارسال تعداد بیننده‌ها به کنترل‌کننده‌ها
  for (const socketId of sockets || []) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.data.role === 'controller') {
      socket.emit('viewer-count', viewerCount);
    }
  }
  
  return viewerCount;
}

// رویداد خطای سرور
httpServer.on('error', (error) => {
  console.error('خطای سرور HTTP:', error);
});

// شروع سرور
httpServer.listen(Number(PORT), HOST, () => {
  const localIp = getLocalIpAddress();
  console.log(`سرور Socket.IO در حال اجرا روی پورت ${PORT} و آدرس ${HOST}`);
  console.log(`آدرس محلی: http://localhost:${PORT}`);
  console.log(`آدرس شبکه: http://${localIp}:${PORT}`);
  console.log(`\nبرای دسترسی از موبایل، از آدرس‌های زیر استفاده کنید:`);
  console.log(`- سرور: http://${localIp}:${PORT}`);
  console.log(`- کلاینت: http://${localIp}:3333`);
  console.log(`\nبرای اتصال به کلاینت، این آدرس را در مرورگر موبایل وارد کنید: http://${localIp}:3333`);
}); 