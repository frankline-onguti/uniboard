import pool from './connection';
import { PasswordService } from '../services/authService';

interface SeedUser {
  email: string;
  password: string;
  role: 'student' | 'admin' | 'super_admin';
  firstName: string;
  lastName: string;
  studentId?: string;
}

interface SeedNotice {
  title: string;
  content: string;
  category: string;
  createdByEmail: string;
  expiresAt?: string;
  priority?: number;
}

class DatabaseSeeder {
  private async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing seed data...');
    
    // Clear in reverse dependency order
    await database.query('DELETE FROM applications WHERE 1=1');
    await database.query('DELETE FROM refresh_tokens WHERE 1=1');
    await database.query('DELETE FROM notices WHERE 1=1');
    await database.query('DELETE FROM users WHERE email LIKE \'%@seed.uniboard.local\'');
    
    console.log('✅ Existing seed data cleared');
  }

  private async seedUsers(): Promise<Map<string, string>> {
    console.log('👥 Seeding users...');
    
    const users: SeedUser[] = [
      {
        email: 'superadmin@seed.uniboard.local',
        password: 'SuperAdmin123!',
        role: 'super_admin',
        firstName: 'System',
        lastName: 'Administrator',
      },
      {
        email: 'admin@seed.uniboard.local',
        password: 'Admin123!',
        role: 'admin',
        firstName: 'John',
        lastName: 'Admin',
      },
      {
        email: 'admin2@seed.uniboard.local',
        password: 'Admin123!',
        role: 'admin',
        firstName: 'Sarah',
        lastName: 'Manager',
      },
      {
        email: 'student1@seed.uniboard.local',
        password: 'Student123!',
        role: 'student',
        firstName: 'Alice',
        lastName: 'Johnson',
        studentId: 'STU001234',
      },
      {
        email: 'student2@seed.uniboard.local',
        password: 'Student123!',
        role: 'student',
        firstName: 'Bob',
        lastName: 'Wilson',
        studentId: 'STU001235',
      },
      {
        email: 'student3@seed.uniboard.local',
        password: 'Student123!',
        role: 'student',
        firstName: 'Carol',
        lastName: 'Davis',
        studentId: 'STU001236',
      },
    ];

    const userIdMap = new Map<string, string>();

    for (const user of users) {
      const passwordHash = await PasswordService.hashPassword(user.password);
      
      const result = await database.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, student_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [user.email, passwordHash, user.role, user.firstName, user.lastName, user.studentId || null]
      );

      userIdMap.set(user.email, result.rows[0].id);
      console.log(`  ✅ Created ${user.role}: ${user.email}`);
    }

    return userIdMap;
  }

  private async seedNotices(userIdMap: Map<string, string>): Promise<Map<string, string>> {
    console.log('📢 Seeding notices...');
    
    const notices: SeedNotice[] = [
      {
        title: 'Merit-Based Scholarship Application Open',
        content: `The Merit-Based Scholarship for Academic Excellence is now accepting applications for the Spring 2024 semester. 

**Eligibility Requirements:**
- Minimum GPA of 3.5
- Demonstrated financial need
- Full-time enrollment status
- U.S. citizen or permanent resident

**Application Requirements:**
- Completed application form
- Official transcripts
- Two letters of recommendation
- Personal essay (500 words max)
- FAFSA documentation

**Award Details:**
- Up to $5,000 per semester
- Renewable for up to 4 semesters
- Direct payment to student account

**Important Dates:**
- Application Deadline: March 15, 2024
- Notification Date: April 1, 2024
- Award Distribution: Beginning of Fall 2024 semester

For questions, contact the Financial Aid Office at finaid@university.edu or visit our office in Student Services Building, Room 201.`,
        category: 'scholarship',
        createdByEmail: 'admin@seed.uniboard.local',
        expiresAt: '2024-03-15 23:59:59',
        priority: 5,
      },
      {
        title: 'Research Assistant Positions Available',
        content: `The Computer Science Department is hiring undergraduate research assistants for the Spring 2024 semester.

**Available Positions:**
- AI/Machine Learning Lab (2 positions)
- Cybersecurity Research Group (1 position)
- Software Engineering Lab (2 positions)
- Human-Computer Interaction Lab (1 position)

**Requirements:**
- Minimum 3.0 GPA
- Completed CS 201 and CS 202
- Strong programming skills in Python, Java, or C++
- Ability to work 10-15 hours per week

**Responsibilities:**
- Assist with ongoing research projects
- Data collection and analysis
- Literature reviews
- Prototype development
- Present findings at lab meetings

**Compensation:**
- $15/hour
- Flexible scheduling around classes
- Opportunity for academic credit
- Potential for publication co-authorship

**How to Apply:**
Submit your resume, unofficial transcript, and a brief cover letter explaining your research interests to cs-research@university.edu.`,
        category: 'job',
        createdByEmail: 'admin@seed.uniboard.local',
        expiresAt: '2024-02-28 23:59:59',
        priority: 4,
      },
      {
        title: 'Study Abroad Information Session',
        content: `Join us for an information session about study abroad opportunities for Fall 2024.

**Featured Programs:**
- Engineering in Germany (TU Munich partnership)
- Business in Singapore (NUS collaboration)
- Liberal Arts in Italy (Florence campus)
- Computer Science in South Korea (KAIST exchange)

**Session Details:**
- Date: February 20, 2024
- Time: 6:00 PM - 8:00 PM
- Location: Student Union Ballroom
- Light refreshments provided

**What You'll Learn:**
- Program requirements and application process
- Financial aid and scholarship opportunities
- Academic credit transfer policies
- Housing and cultural preparation
- Student testimonials and Q&A

**Special Guests:**
- International Programs Director
- Returned study abroad students
- Partner university representatives

**Financial Aid Available:**
- Study abroad scholarships up to $3,000
- Federal financial aid applies
- Payment plan options
- Emergency travel fund access

Register at international.university.edu or contact the International Programs Office at study-abroad@university.edu.`,
        category: 'event',
        createdByEmail: 'admin2@seed.uniboard.local',
        expiresAt: '2024-02-20 18:00:00',
        priority: 3,
      },
      {
        title: 'Annual Career Fair Registration Now Open',
        content: `The Annual Career Fair will be held on March 10, 2024. Over 100 companies will be participating.

**Participating Companies Include:**
- Technology: Google, Microsoft, Apple, Amazon, Meta
- Finance: Goldman Sachs, JPMorgan Chase, Bank of America
- Consulting: McKinsey, Deloitte, PwC, Accenture
- Healthcare: Johnson & Johnson, Pfizer, Mayo Clinic
- Engineering: Boeing, Lockheed Martin, Tesla, SpaceX

**Event Details:**
- Date: March 10, 2024
- Time: 10:00 AM - 4:00 PM
- Location: Recreation Center Main Gym
- Professional attire required

**Preparation Resources:**
- Resume review sessions (Feb 26-Mar 8)
- Mock interview workshops
- LinkedIn profile optimization
- Industry-specific networking tips
- Salary negotiation strategies

**Registration Benefits:**
- Priority access to company booths
- Pre-event company information packets
- Digital resume book submission
- Post-event follow-up coordination
- Career counseling appointments

**How to Register:**
1. Upload your resume to the career portal
2. Complete your profile information
3. Select companies of interest
4. Schedule any prep sessions
5. Confirm your attendance

Register now at careers.university.edu to secure your spot. Limited capacity with over 2,000 students expected to attend.`,
        category: 'career',
        createdByEmail: 'admin@seed.uniboard.local',
        expiresAt: '2024-03-08 23:59:59',
        priority: 4,
      },
      {
        title: 'Library Extended Hours During Finals Week',
        content: `The University Library will extend its hours during Finals Week (March 20-27, 2024) to support student success.

**Extended Hours:**
- Monday-Thursday: 24/7 (continuous operation)
- Friday: 7:00 AM - 10:00 PM
- Saturday: 8:00 AM - 10:00 PM
- Sunday: 10:00 AM - 2:00 AM (Monday)

**Additional Resources:**
- 50 extra study spaces in the basement level
- 24/7 computer lab access (Level 2)
- Extended café hours until midnight
- Quiet study zones strictly enforced
- Group study rooms available for reservation

**Services Available:**
- Research assistance until 2:00 AM
- Printing and scanning services
- Laptop and charger lending
- Study supplies vending machine
- Stress-relief therapy dogs (daily 2-4 PM)

**Study Tips:**
- Reserve group study rooms in advance
- Use noise-canceling headphones in open areas
- Take regular breaks every 2 hours
- Stay hydrated and eat regular meals
- Utilize the meditation room (Level 3)

**Safety Measures:**
- Security guards on duty 24/7
- Well-lit pathways and parking
- Emergency call stations throughout
- Escort service available
- ID required for after-hours access

For room reservations, visit library.university.edu or call (555) 123-BOOK.`,
        category: 'announcement',
        createdByEmail: 'admin2@seed.uniboard.local',
        expiresAt: '2024-03-27 23:59:59',
        priority: 2,
      },
      {
        title: 'Spring Break Housing Closure Notice',
        content: `Important information regarding residence hall closures during Spring Break.

**Closure Period:**
- Residence halls close: March 1, 2024 at 6:00 PM
- Residence halls reopen: March 11, 2024 at 12:00 PM
- Dining services suspended during closure

**What You Need to Know:**
- All residents must vacate by the closure deadline
- Room keys must be returned to front desk
- Personal belongings may remain in rooms
- Maintenance and deep cleaning will occur
- No guest access during closure period

**Exceptions:**
- International students may apply for break housing
- Students with documented need may request accommodation
- Resident Advisors and essential staff may remain
- Applications due by February 15, 2024

**Preparation Checklist:**
- Unplug all electrical devices
- Remove perishable food items
- Secure valuable belongings
- Complete room condition report
- Provide emergency contact information

**Break Housing Application:**
- $25/night fee for approved residents
- Limited to specific residence halls
- Dining plan not included
- Must provide justification for need
- Apply at housing.university.edu

**Questions?**
Contact Residence Life at (555) 123-DORM or housing@university.edu.`,
        category: 'housing',
        createdByEmail: 'admin@seed.uniboard.local',
        expiresAt: '2024-03-01 18:00:00',
        priority: 3,
      },
    ];

    const noticeIdMap = new Map<string, string>();

    for (const notice of notices) {
      const createdById = userIdMap.get(notice.createdByEmail);
      if (!createdById) {
        throw new Error(`User not found: ${notice.createdByEmail}`);
      }

      const result = await database.query(
        `INSERT INTO notices (title, content, category, created_by, expires_at, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          notice.title,
          notice.content,
          notice.category,
          createdById,
          notice.expiresAt || null,
          notice.priority || 0,
        ]
      );

      noticeIdMap.set(notice.title, result.rows[0].id);
      console.log(`  ✅ Created notice: ${notice.title}`);
    }

    return noticeIdMap;
  }

  private async seedApplications(
    userIdMap: Map<string, string>,
    noticeIdMap: Map<string, string>
  ): Promise<void> {
    console.log('📝 Seeding applications...');

    const applications = [
      {
        studentEmail: 'student1@seed.uniboard.local',
        noticeTitle: 'Merit-Based Scholarship Application Open',
        status: 'pending',
        applicationData: {
          gpa: 3.8,
          essay: 'I am passionate about computer science and have maintained excellent grades throughout my academic career. This scholarship would help me focus on my studies without the burden of financial stress.',
          financialNeed: true,
          expectedGraduation: '2025-05-15',
          major: 'Computer Science',
          extracurriculars: ['Programming Club', 'Volunteer Tutoring', 'Hackathon Participant'],
        },
      },
      {
        studentEmail: 'student1@seed.uniboard.local',
        noticeTitle: 'Research Assistant Positions Available',
        status: 'approved',
        applicationData: {
          gpa: 3.8,
          preferredLab: 'AI/Machine Learning Lab',
          experience: 'Completed CS 301 (Data Structures) and CS 401 (Algorithms) with A grades. Personal projects include a machine learning model for predicting student performance.',
          availability: '15 hours per week',
          programmingLanguages: ['Python', 'Java', 'C++', 'JavaScript'],
        },
        adminNotes: 'Excellent academic record and strong interest in AI research. Good fit for the ML lab.',
        reviewedByEmail: 'admin@seed.uniboard.local',
      },
      {
        studentEmail: 'student2@seed.uniboard.local',
        noticeTitle: 'Research Assistant Positions Available',
        status: 'pending',
        applicationData: {
          gpa: 3.2,
          preferredLab: 'Cybersecurity Research Group',
          experience: 'Self-taught ethical hacking, completed online courses in network security. Participated in university CTF competitions.',
          availability: '12 hours per week',
          programmingLanguages: ['Python', 'C', 'Bash', 'SQL'],
        },
      },
      {
        studentEmail: 'student3@seed.uniboard.local',
        noticeTitle: 'Study Abroad Information Session',
        status: 'approved',
        applicationData: {
          preferredCountry: 'Germany',
          program: 'Engineering in Germany (TU Munich partnership)',
          language: 'German (intermediate level)',
          major: 'Computer Science',
          reason: 'I want to experience different teaching methods and gain international perspective on technology.',
        },
        adminNotes: 'Good fit for our German exchange program. Language skills are adequate.',
        reviewedByEmail: 'admin2@seed.uniboard.local',
      },
      {
        studentEmail: 'student2@seed.uniboard.local',
        noticeTitle: 'Merit-Based Scholarship Application Open',
        status: 'rejected',
        applicationData: {
          gpa: 3.2,
          essay: 'I need financial assistance to continue my studies and focus on my academic goals.',
          financialNeed: true,
          expectedGraduation: '2025-12-15',
          major: 'Information Systems',
        },
        adminNotes: 'GPA below minimum requirement of 3.5. Encourage student to reapply next semester after improving grades.',
        reviewedByEmail: 'admin@seed.uniboard.local',
      },
    ];

    for (const app of applications) {
      const studentId = userIdMap.get(app.studentEmail);
      const noticeId = noticeIdMap.get(app.noticeTitle);
      
      if (!studentId || !noticeId) {
        console.error(`Skipping application: student or notice not found`);
        continue;
      }

      let reviewedBy = null;
      if (app.reviewedByEmail) {
        reviewedBy = userIdMap.get(app.reviewedByEmail);
      }

      await database.query(
        `INSERT INTO applications (
          notice_id, student_id, status, application_data, 
          admin_notes, reviewed_by, reviewed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          noticeId,
          studentId,
          app.status,
          JSON.stringify(app.applicationData),
          app.adminNotes || null,
          reviewedBy,
          app.status !== 'pending' ? new Date() : null,
        ]
      );

      console.log(`  ✅ Created application: ${app.studentEmail} -> ${app.noticeTitle}`);
    }
  }

  public async run(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...');
      
      await this.clearExistingData();
      const userIdMap = await this.seedUsers();
      const noticeIdMap = await this.seedNotices(userIdMap);
      await this.seedApplications(userIdMap, noticeIdMap);
      
      console.log('✅ Database seeding completed successfully!');
      console.log('\n📋 Seed Data Summary:');
      console.log('  👤 Users: 6 (1 super_admin, 2 admins, 3 students)');
      console.log('  📢 Notices: 6 (various categories)');
      console.log('  📝 Applications: 5 (various statuses)');
      console.log('\n🔑 Login Credentials:');
      console.log('  Super Admin: superadmin@seed.uniboard.local / SuperAdmin123!');
      console.log('  Admin: admin@seed.uniboard.local / Admin123!');
      console.log('  Student: student1@seed.uniboard.local / Student123!');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  (async () => {
    const seeder = new DatabaseSeeder();
    try {
      await seeder.run();
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    } finally {
      await database.close();
    }
  })();
}

export { DatabaseSeeder };