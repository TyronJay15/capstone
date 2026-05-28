const CMS_KEY = 'gradeportal_cms_content';
const CMS_EVENT = 'gradeportal-cms-updated';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const POST_TYPES = {
  ANNOUNCEMENT: 'announcement',
  EVENT: 'event',
  ACHIEVEMENT: 'achievement',
  STUDENT: 'student',
  COMMUNITY: 'community',
  NEWS: 'news'
};

export const POST_TYPE_LABELS = {
  [POST_TYPES.ANNOUNCEMENT]: 'Announcements',
  [POST_TYPES.EVENT]: 'Events',
  [POST_TYPES.ACHIEVEMENT]: 'Achievements',
  [POST_TYPES.STUDENT]: 'Student Information',
  [POST_TYPES.COMMUNITY]: 'Community Updates',
  [POST_TYPES.NEWS]: 'News & Activities'
};

const DEFAULT_CONTENT = {
  landing: {
    slides: [
      {
        id: 'slide-1',
        kicker: 'Dampol 1st National High School',
        title: 'Learning Today. Leading Tomorrow.',
        body: 'A home for growth, discipline, and excellence — built with the community.',
        image: '/landingpage/damo.jpg',
        ctaPrimary: { to: '/signup', label: 'Enroll / Register' },
        ctaSecondary: { to: '/about', label: 'Learn more' }
      },
      {
        id: 'slide-2',
        kicker: 'Programs & Activities',
        title: 'Developing Skills Beyond the Classroom',
        body: 'Student clubs, leadership, and community programs that strengthen character.',
        image: '/landingpage/dammo2.jpg',
        ctaPrimary: { to: '/programs', label: 'View programs' },
        ctaSecondary: { to: '/contact', label: 'Contact us' }
      },
      {
        id: 'slide-3',
        kicker: 'Announcements',
        title: 'Stay Updated With School News',
        body: 'Upcoming events, important notices, and school-wide updates — all in one place.',
        image: '/landingpage/damo3.jpg',
        ctaPrimary: { to: '/contact', label: 'Ask a question' },
        ctaSecondary: { to: '/login', label: 'Sign in' }
      },
      {
        id: 'slide-4',
        kicker: 'Dampol 1st National High School',
        title: 'Welcome to Dampol 1st National High School',
        body: 'A glimpse of our campus — where learning and community meet.',
        image: '/landingpage/dampolzz.jpg',
        ctaPrimary: { to: '/signup', label: 'Register now' },
        ctaSecondary: { to: '/about', label: 'About the school' }
      }
    ],
    aboutCards: [
      {
        id: 'lp-mission',
        icon: '🎯',
        title: 'Mission',
        body: 'Provide quality education that develops students holistically and prepares them for life-long learning.',
        image: '/logo/logodampol.jpg',
        linkTo: '/about',
        cta: 'Read mission'
      },
      {
        id: 'lp-vision',
        icon: '👁️',
        title: 'Vision',
        body: 'Produce globally competitive, morally upright, and socially responsible citizens.',
        image: '/logo/logodampol.jpg',
        linkTo: '/about',
        cta: 'Read vision'
      },
      {
        id: 'lp-values',
        icon: '🤝',
        title: 'Core Values',
        body: 'Respect, discipline, excellence, and service — guided by our community and shared goals.',
        image: '/logo/logodampol.jpg',
        linkTo: '/about',
        cta: 'See values'
      }
    ],
    aboutSection: {
      title: 'About Dampol 1st',
      subtitle: 'What we do, what we believe in, and how we serve our learners and community.'
    },
    bulletinSection: {
      title: 'Campus Bulletin',
      subtitle: 'Updates about school activities, student life, and important notices.'
    },
    banner: {
      schoolTitle: 'DAMPOL 1ST NATIONAL HIGH SCHOOL',
      admissionText: 'Now Accepting Admissions for S.Y. 2025-2026',
      description: 'Enroll today and discover a world of learning, growth, and endless possibilities.'
    },
    footer: {
      address: 'Dampol, Pulilan, Bulacan, Philippines',
      addressNote: '',
      facebookUrl: 'https://facebook.com/dampol1stnationalhighschool'
    }
  },
  about: {
    header: {
      title: 'About Our School',
      subtitlePrefix: 'Excellence in Education Since',
      description:
        'Dampol 1st National High School has been committed to providing quality education and shaping the future of our students for over five decades.'
    },
    schoolInfo: {
      established: '1965',
      motto: 'Thy Light Shall Guide Us!',
      vision:
        'To be a leading educational institution that produces globally competitive, morally upright, and socially responsible citizens.',
      mission:
        'To provide quality education that develops the intellectual, physical, social, and spiritual aspects of every student, preparing them for life-long learning and responsible citizenship.'
    },
    history: [
      { id: 'h1', year: '1965', event: 'Dampol 1st National High School was established' },
      { id: 'h2', year: '1980', event: 'First batch of graduates completed their secondary education' },
      { id: 'h3', year: '1995', event: 'Recognition as a National High School by the Department of Education' },
      { id: 'h4', year: '2010', event: 'Introduction of computer laboratories and modern learning facilities' },
      { id: 'h5', year: '2016', event: 'Implementation of Senior High School program' },
      { id: 'h6', year: '2020', event: 'Adaptation to blended learning during the pandemic' }
    ],
    achievements: [
      { id: 'a1', text: 'Recognition as a National High School' },
      { id: 'a2', text: 'Consistent high performance in regional academic competitions' },
      { id: 'a3', text: 'Active participation in community development programs' },
      { id: 'a4', text: 'Strong partnership with local government and organizations' },
      { id: 'a5', text: 'Modern facilities and learning resources' },
      { id: 'a6', text: 'Qualified and dedicated teaching staff' }
    ],
    features: [
      {
        id: 'f1',
        icon: 'fas fa-users',
        title: 'Experienced Faculty',
        description: 'Our teachers are highly qualified and dedicated to student success'
      },
      {
        id: 'f2',
        icon: 'fas fa-book',
        title: 'Comprehensive Curriculum',
        description: 'Well-rounded education covering academic and practical skills'
      },
      {
        id: 'f3',
        icon: 'fas fa-laptop',
        title: 'Modern Facilities',
        description: 'State-of-the-art laboratories and learning resources'
      },
      {
        id: 'f4',
        icon: 'fas fa-heart',
        title: 'Supportive Environment',
        description: 'Nurturing atmosphere that promotes growth and development'
      }
    ],
    cta: {
      title: 'Join Our Community',
      body: 'Be part of our legacy of excellence in education'
    }
  },
  programs: {
    header: {
      title: 'Senior High School Programs',
      subtitle: 'Choose your path to success',
      description:
        'Dampol 1st National High School offers comprehensive Senior High School programs designed to prepare students for college, entrepreneurship, or immediate employment.'
    },
    tracks: [
      {
        id: 'track-academic',
        title: 'Academic Track',
        description: 'Designed for students who plan to pursue higher education',
        strands: [
          {
            id: 'stem',
            name: 'Science, Technology, Engineering, and Mathematics (STEM)',
            description:
              'Focuses on advanced sciences and mathematics for students interested in engineering, medicine, and technology careers.'
          },
          {
            id: 'abm',
            name: 'Accountancy, Business, and Management (ABM)',
            description: 'Prepares students for careers in business, finance, and entrepreneurship.'
          },
          {
            id: 'humss',
            name: 'Humanities and Social Sciences (HUMSS)',
            description:
              'Develops critical thinking and communication skills for careers in law, education, and social sciences.'
          },
          {
            id: 'gas',
            name: 'General Academic Strand (GAS)',
            description: 'Provides flexibility for students who are undecided about their career path.'
          }
        ]
      },
      {
        id: 'track-tvl',
        title: 'Technical-Vocational-Livelihood (TVL) Track',
        description: 'Provides practical skills and competencies for immediate employment',
        strands: [
          {
            id: 'ict',
            name: 'Information and Communications Technology (ICT)',
            description: 'Computer programming, web development, and digital media production.'
          },
          {
            id: 'he',
            name: 'Home Economics (HE)',
            description: 'Culinary arts, tourism, hospitality, and fashion design.'
          },
          {
            id: 'ia',
            name: 'Industrial Arts (IA)',
            description: 'Automotive, electrical, welding, and construction technology.'
          },
          {
            id: 'afa',
            name: 'Agri-Fishery Arts (AFA)',
            description: 'Agricultural production, aquaculture, and food processing.'
          }
        ]
      }
    ],
    cta: {
      title: 'Ready to Start Your Journey?',
      body: 'Apply now for School Year 2025-2026'
    }
  },
  contact: {
    header: {
      title: 'Contact Us',
      subtitle: 'Get in touch with Dampol 1st National High School',
      description:
        "We're here to help you with any questions about admissions, programs, or school information. Reach out to us through any of the channels below."
    },
    contactInfo: {
      address: 'Dampol 1st, Pulilan, Bulacan, Philippines',
      phone: '(044) 123-4567',
      email: 'info@dampol1st.edu.ph',
      facebook: 'https://facebook.com/dampol1stnationalhighschool',
      hours: 'Monday - Friday: 7:00 AM - 5:00 PM'
    },
    departments: [
      {
        id: 'dept-1',
        name: "Principal's Office",
        phone: '(044) 123-4568',
        email: 'principal@dampol1st.edu.ph'
      },
      {
        id: 'dept-2',
        name: "Registrar's Office",
        phone: '(044) 123-4569',
        email: 'registrar@dampol1st.edu.ph'
      },
      {
        id: 'dept-3',
        name: 'Guidance Office',
        phone: '(044) 123-4570',
        email: 'guidance@dampol1st.edu.ph'
      },
      {
        id: 'dept-4',
        name: 'Senior High School Office',
        phone: '(044) 123-4571',
        email: 'shs@dampol1st.edu.ph'
      }
    ]
  },
  mediaLibrary: [],
  posts: [
    {
      id: 'post-1',
      type: POST_TYPES.ANNOUNCEMENT,
      title: 'Upcoming School Activities',
      body: 'Join us for upcoming campus activities and important school-wide events this month.',
      image: '/bulletin/cur.jpg',
      linkTo: '/programs',
      cta: 'Read announcement',
      eventDate: '',
      published: true,
      createdAt: '2026-03-01T08:00:00.000Z'
    },
    {
      id: 'post-2',
      type: POST_TYPES.STUDENT,
      title: 'Student Clubs & Leadership',
      body: 'Explore student organizations and leadership opportunities for the school year.',
      image: '/bulletin/cur2.jpg',
      linkTo: '/programs',
      cta: 'Read update',
      eventDate: '',
      published: true,
      createdAt: '2026-03-02T08:00:00.000Z'
    },
    {
      id: 'post-3',
      type: POST_TYPES.COMMUNITY,
      title: 'Community Programs',
      body: 'Highlights from our outreach and partnership programs with the local community.',
      image: '/bulletin/cur4.jpg',
      linkTo: '/programs',
      cta: 'Read story',
      eventDate: '',
      published: true,
      createdAt: '2026-03-03T08:00:00.000Z'
    },
    {
      id: 'post-4',
      type: POST_TYPES.ANNOUNCEMENT,
      title: 'Enrollment Reminders',
      body: 'Important dates and requirements for School Year 2025-2026 enrollment.',
      image: '/bulletin/cur1.jpg',
      linkTo: '/signup',
      cta: 'View details',
      eventDate: '',
      published: true,
      createdAt: '2026-03-04T08:00:00.000Z'
    },
    {
      id: 'post-5',
      type: POST_TYPES.EVENT,
      title: 'Foundation Day Celebration',
      body: 'Annual school foundation day with performances, exhibits, and community booths.',
      image: '/bulletin/cur3.jpg',
      linkTo: '/about',
      cta: 'View event',
      eventDate: '2026-06-15',
      published: true,
      createdAt: '2026-03-05T08:00:00.000Z'
    },
    {
      id: 'post-6',
      type: POST_TYPES.ACHIEVEMENT,
      title: 'Regional Academic Champions',
      body: 'Our students placed top three in the regional science and math competition.',
      image: '/bulletin/cur5.jpg',
      linkTo: '/about',
      cta: 'Read more',
      eventDate: '',
      published: true,
      createdAt: '2026-03-06T08:00:00.000Z'
    },
    {
      id: 'post-7',
      type: POST_TYPES.NEWS,
      title: 'New Computer Laboratory',
      body: 'The school inaugurated an upgraded ICT laboratory for Senior High School learners.',
      image: '/landingpage/dammo2.jpg',
      linkTo: '/programs',
      cta: 'Read news',
      eventDate: '',
      published: true,
      createdAt: '2026-03-07T08:00:00.000Z'
    }
  ]
};

function notifyCmsChange() {
  window.dispatchEvent(new CustomEvent(CMS_EVENT));
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(CMS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeDefaults(stored) {
  if (!stored) return structuredClone(DEFAULT_CONTENT);
  return {
    landing: { ...DEFAULT_CONTENT.landing, ...stored.landing },
    about: {
      ...DEFAULT_CONTENT.about,
      ...stored.about,
      schoolInfo: { ...DEFAULT_CONTENT.about.schoolInfo, ...stored.about?.schoolInfo },
      header: { ...DEFAULT_CONTENT.about.header, ...stored.about?.header }
    },
    programs: {
      ...DEFAULT_CONTENT.programs,
      ...stored.programs,
      header: { ...DEFAULT_CONTENT.programs.header, ...stored.programs?.header }
    },
    contact: {
      ...DEFAULT_CONTENT.contact,
      ...stored.contact,
      header: { ...DEFAULT_CONTENT.contact.header, ...stored.contact?.header },
      contactInfo: { ...DEFAULT_CONTENT.contact.contactInfo, ...stored.contact?.contactInfo }
    },
    mediaLibrary: stored.mediaLibrary || [],
    posts: stored.posts?.length ? stored.posts : DEFAULT_CONTENT.posts
  };
}

function initCmsIfNeeded() {
  if (!loadRaw()) {
    localStorage.setItem(CMS_KEY, JSON.stringify(DEFAULT_CONTENT));
    notifyCmsChange();
  }
}

initCmsIfNeeded();

export function subscribeCmsStore(callback) {
  const handler = () => callback();
  window.addEventListener(CMS_EVENT, handler);
  return () => window.removeEventListener(CMS_EVENT, handler);
}

export function getCmsContent() {
  return mergeDefaults(loadRaw());
}

export function saveCmsContent(content) {
  localStorage.setItem(CMS_KEY, JSON.stringify(content));
  notifyCmsChange();
}

export function updateCmsSection(sectionKey, patch) {
  const content = getCmsContent();
  content[sectionKey] = { ...content[sectionKey], ...patch };
  saveCmsContent(content);
  return content;
}

export function getPostsByType(type, { publishedOnly = true } = {}) {
  const posts = getCmsContent().posts || [];
  return posts
    .filter((p) => p.type === type && (!publishedOnly || p.published !== false))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getBulletinPosts(tab) {
  const typeMap = {
    Announcements: POST_TYPES.ANNOUNCEMENT,
    Students: POST_TYPES.STUDENT,
    Community: POST_TYPES.COMMUNITY
  };
  const type = typeMap[tab];
  if (!type) return [];
  return getPostsByType(type).slice(0, 6);
}

export function createId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function upsertPost(post) {
  const content = getCmsContent();
  const idx = content.posts.findIndex((p) => p.id === post.id);
  const next = {
    published: true,
    createdAt: new Date().toISOString(),
    ...post
  };
  if (idx >= 0) content.posts[idx] = { ...content.posts[idx], ...next };
  else content.posts.unshift(next);
  saveCmsContent(content);
  return next;
}

export function deletePost(id) {
  const content = getCmsContent();
  content.posts = content.posts.filter((p) => p.id !== id);
  saveCmsContent(content);
}

export async function uploadMediaFile(file) {
  if (!file) throw new Error('No file selected.');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 2MB or smaller.');

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  const item = {
    id: createId('media'),
    name: file.name,
    url: dataUrl,
    type: file.type,
    uploadedAt: new Date().toISOString()
  };

  const content = getCmsContent();
  content.mediaLibrary = [item, ...(content.mediaLibrary || [])];
  saveCmsContent(content);
  return item;
}

export function deleteMedia(id) {
  const content = getCmsContent();
  content.mediaLibrary = (content.mediaLibrary || []).filter((m) => m.id !== id);
  saveCmsContent(content);
}

export function resetCmsToDefaults() {
  saveCmsContent(structuredClone(DEFAULT_CONTENT));
}
