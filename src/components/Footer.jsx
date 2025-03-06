import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram, 
         FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  // Company social links
  const socialLinks = [
    { icon: <FaTwitter />, href: "https://twitter.com/webreich", label: "Twitter" },
    { icon: <FaGithub />, href: "https://github.com/webreich", label: "GitHub" },
    { icon: <FaLinkedin />, href: "https://linkedin.com/company/webreich", label: "LinkedIn" },
    { icon: <FaInstagram />, href: "https://instagram.com/webreich", label: "Instagram" }
  ];

  // Footer links sections
  const footerSections = [
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Our Team", href: "/team" },
        { name: "Careers", href: "/careers" },
        { name: "News", href: "/news" }
      ]
    },
    {
      title: "Services",
      links: [
        { name: "Web Development", href: "/services/web-development" },
        { name: "Mobile Apps", href: "/services/mobile-apps" },
        { name: "UI/UX Design", href: "/services/design" },
        { name: "Consulting", href: "/services/consulting" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Documentation", href: "/docs" },
        { name: "Case Studies", href: "/case-studies" },
        { name: "FAQs", href: "/faqs" }
      ]
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">WebReich</h2>
              <div className="w-12 h-1 bg-orange-500 mt-2 mb-4"></div>
              <p className="text-gray-600 mb-6">
                Empowering businesses with innovative digital solutions that drive growth and transformation.
              </p>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-orange-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-gray-600">Akola, Maharashtra, India</p>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-orange-500 mr-3 flex-shrink-0" />
                <p className="text-gray-600">+91-8668722207 / +91-9834153020 </p>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-orange-500 mr-3 flex-shrink-0" />
                <a href="mailto:webreichcommunity@gmail.com" className="text-gray-600 hover:text-orange-500 transition-colors">
                  contact@WebreichTechnologies
                </a>
              </div>
            </div>
          </div>
          
          {/* Footer Links Sections */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {footerSections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.links.map((link, idx) => (
                      <li key={idx}>
                        <a 
                          href={link.href} 
                          className="text-gray-600 hover:text-orange-500 transition-colors block py-1"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Stay Updated</h3>
            <p className="text-gray-600 mb-4">Subscribe to our newsletter for the latest news and insights.</p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                required
              />
              <button 
                type="submit"
                className="w-full bg-orange-500 text-white font-medium py-2 px-4 rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm mb-4 md:mb-0">
              &copy; {currentYear} WebReich. All rights reserved.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-orange-500 transition-colors p-2"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;