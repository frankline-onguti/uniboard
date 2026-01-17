#!/usr/bin/env tsx

import { pool, testConnection, closeConnection } from '../database/connection';
import { PasswordService } from '../services/authService';

async function seedDatabase() {
  try {
    console.log('🌱 UniBoard Database Seeder');
    console.log('===========================');
    
    // Test database connection
    await testConnection();
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if users already exist
      const existingUsers = await client.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(existingUsers.rows[0].count);
      
      if (userCount > 0) {
        console.log(`⚠️  Database already has ${userCount} users. Skipping seed.`);
        await client.query('ROLLBACK');
        return;
      }
      
      console.log('🔄 Seeding initial users...');
      
      // Hash passwords (same for all dev accounts)
      const devPassword = 'DevPass123!';
      const hashedPassword = await PasswordService.hashPassword(devPassword);
      
      // Insert super admin
      const superAdminResult = await client.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        'superadmin@university.edu',
        hashedPassword,
        'super_admin',
        'System',
        'Administrator'
      ]);
      const superAdminId = superAdminResult.rows[0].id;
      console.log('✅ Created super admin: superadmin@university.edu');
      
      // Insert admin
      const adminResult = await client.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        'admin@university.edu',
        hashedPassword,
        'admin',
        'John',
        'Administrator'
      ]);
      const adminId = adminResult.rows[0].id;
      console.log('✅ Created admin: admin@university.edu');
      
      // Insert students
      const students = [
        {
          email: 'alice.student@university.edu',
          firstName: 'Alice',
          lastName: 'Johnson',
          studentId: 'STU001234'
        },
        {
          email: 'bob.student@university.edu',
          firstName: 'Bob',
          lastName: 'Wilson',
          studentId: 'STU001235'
        },
        {
          email: 'carol.student@university.edu',
          firstName: 'Carol',
          lastName: 'Davis',
          studentId: 'STU001236'
        }
      ];
      
      const studentIds: string[] = [];
      
      for (const student of students) {
        const result = await client.query(`
          INSERT INTO users (email, password_hash, role, first_name, last_name, student_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          student.email,
          hashedPassword,
          'student',
          student.firstName,
          student.lastName,
          student.studentId
        ]);
        
        studentIds.push(result.rows[0].id);
        console.log(`✅ Created student: ${student.email} (${student.studentId})`);
      }
      
      console.log('🔄 Seeding sample notices...');
      
      // Insert sample notices
      const notices = [
        {
          title: 'Merit Scholarship Application Open',
          content: 'The Merit-Based Scholarship for Academic Excellence is now accepting applications. Eligible students must have a GPA of 3.5 or higher and demonstrate financial need. Application deadline is March 15, 2026.',
          category: 'scholarship',
          expiresAt: '2026-03-15 23:59:59'
        },
        {
          title: 'Research Assistant Positions Available',
          content: 'The Computer Science Department is hiring undergraduate research assistants for the Spring 2026 semester. Positions available in AI, cybersecurity, and software engineering labs. Minimum 3.0 GPA required.',
          category: 'job',
          expiresAt: '2026-02-28 23:59:59'
        },
        {
          title: 'Study Abroad Information Session',
          content: 'Join us for an information session about study abroad opportunities for Fall 2026. Learn about programs in Europe, Asia, and Australia. Financial aid and scholarships available.',
          category: 'event',
          expiresAt: '2026-02-20 18:00:00'
        },
        {
          title: 'Career Fair Registration Now Open',
          content: 'The Annual Career Fair will be held on March 10, 2026. Over 100 companies will be participating. Register now to secure your spot and upload your resume to the career portal.',
          category: 'career',
          expiresAt: '2026-03-08 23:59:59'
        },
        {
          title: 'Library Extended Hours During Finals',
          content: 'During finals week (March 20-27), the library will be open 24/7. Additional study spaces and computer labs will be available. Quiet zones strictly enforced.',
          category: 'announcement',
          expiresAt: '2026-03-27 23:59:59'
        }
      ];
      
      const noticeIds: string[] = [];
      
      for (const notice of notices) {
        const result = await client.query(`
          INSERT INTO notices (title, content, category, created_by, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          notice.title,
          notice.content,
          notice.category,
          adminId,
          notice.expiresAt
        ]);
        
        noticeIds.push(result.rows[0].id);
        console.log(`✅ Created notice: ${notice.title}`);
      }
      
      console.log('🔄 Seeding sample applications...');
      
      // Insert sample applications
      const applications = [
        {
          noticeId: noticeIds[0], // Scholarship
          studentId: studentIds[0], // Alice
          status: 'pending',
          applicationData: {
            gpa: 3.8,
            essay: 'I am passionate about computer science and have maintained excellent grades throughout my academic career...',
            financialNeed: true
          }
        },
        {
          noticeId: noticeIds[1], // Research Assistant
          studentId: studentIds[0], // Alice
          status: 'approved',
          applicationData: {
            gpa: 3.8,
            preferredLab: 'AI',
            experience: 'Completed CS301 and CS401 with A grades, personal projects in machine learning'
          },
          adminNotes: 'Excellent academic record and strong interest in AI research. Approved for AI lab position.',
          reviewedBy: adminId
        },
        {
          noticeId: noticeIds[1], // Research Assistant
          studentId: studentIds[1], // Bob
          status: 'pending',
          applicationData: {
            gpa: 3.2,
            preferredLab: 'cybersecurity',
            experience: 'Self-taught ethical hacking, completed online cybersecurity courses'
          }
        },
        {
          noticeId: noticeIds[2], // Study Abroad
          studentId: studentIds[2], // Carol
          status: 'approved',
          applicationData: {
            preferredCountry: 'Germany',
            language: 'German (intermediate)',
            major: 'Computer Science'
          },
          adminNotes: 'Good fit for our German exchange program. Language skills adequate.',
          reviewedBy: adminId
        },
        {
          noticeId: noticeIds[0], // Scholarship
          studentId: studentIds[1], // Bob
          status: 'rejected',
          applicationData: {
            gpa: 2.9,
            essay: 'I need financial assistance for my studies and would greatly appreciate this opportunity...',
            financialNeed: true
          },
          adminNotes: 'GPA below minimum requirement of 3.5. Encourage student to reapply after improving grades.',
          reviewedBy: adminId
        }
      ];
      
      for (const app of applications) {
        const query = `
          INSERT INTO applications (
            notice_id, student_id, status, application_data, admin_notes, reviewed_by,
            reviewed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        const values = [
          app.noticeId,
          app.studentId,
          app.status,
          JSON.stringify(app.applicationData),
          app.adminNotes || null,
          app.reviewedBy || null,
          app.reviewedBy ? new Date() : null
        ];
        
        await client.query(query, values);
        console.log(`✅ Created application: ${app.status} for notice`);
      }
      
      await client.query('COMMIT');
      
      console.log('\n🎉 Database seeded successfully!');
      console.log('\n📋 Seeded Data Summary:');
      console.log('   👤 Users: 1 super admin, 1 admin, 3 students');
      console.log('   📢 Notices: 5 sample notices');
      console.log('   📝 Applications: 5 sample applications');
      console.log('\n🔑 Default Login Credentials:');
      console.log('   Super Admin: superadmin@university.edu / DevPass123!');
      console.log('   Admin: admin@university.edu / DevPass123!');
      console.log('   Students: alice.student@university.edu / DevPass123!');
      console.log('            bob.student@university.edu / DevPass123!');
      console.log('            carol.student@university.edu / DevPass123!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run seeder
seedDatabase();