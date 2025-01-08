import React from 'react';
import { FaGithub, FaLinkedin, FaGlobe, FaInstagram, 
         FaEnvelope, FaCode, FaHeart } from 'react-icons/fa';

const DeveloperCard = ({ name, image, portfolio, github, linkedin, instagram }) => {
  return (
    <div className="flex flex-col items-center bg-white rounded-lg p-4 shadow-lg transform hover:scale-105 transition-all">
      <div className="relative mb-3">
        <img
          src={image}
          alt={name}
          className="w-20 h-20 rounded-full border-4 border-orange-500 object-cover"
        />
        <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-1">
          <FaCode className="text-white w-4 h-4" />
        </div>
      </div>
      <h3 className="font-bold text-gray-800 mb-1">{name}</h3>
      <p className="text-sm text-orange-600 mb-3">Full Stack Developer</p>
      
      <div className="flex space-x-3">
        {portfolio && (
          <a
            href={portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FaGlobe className="w-5 h-5" />
          </a>
        )}
        {github && (
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FaGithub className="w-5 h-5" />
          </a>
        )}
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FaLinkedin className="w-5 h-5" />
          </a>
        )}
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FaInstagram className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  );
};

const Footer = () => {
  const developers = [
    {
      name: "Shriyash Rulhe",
      image: "https://avatars.githubusercontent.com/u/113467235?v=4",
      portfolio: "https://shriyash.vercel.app",
      github: "https://github.com/shriyashlr",
      linkedin: "https://linkedin.com/in/shriyashrulhe",
      instagram: "https://instagram.com/shriyash.codes"
    },
    {
      name: "Akshay Bhaltilak",
      image: "https://akshay-bhaltilak-portfolio.vercel.app/assets/images/my%20img.jpg",
      portfolio: "https://www.akshaybhaltilak.live/",
      github: "https://github.com/akshaybhaltilak",
      linkedin: "https://linkedin.com/in/akshaybhaltilak",
      instagram: "https://instagram.com/akshay.codes"
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-orange-50 to-orange-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Company Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-orange-600 mb-4">
              WebReich Community
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Empowering businesses with innovative digital solutions. Join our community of forward-thinking entrepreneurs and developers.
            </p>
          </div>

          {/* Developers Section */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-center text-gray-800 mb-8">
              Meet Our Development Team
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {developers.map((dev, index) => (
                <DeveloperCard key={index} {...dev} />
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center mb-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Get in Touch
            </h3>
            <div className="flex justify-center space-x-6">
              <a
                href="mailto:contact@webreich.com"
                className="flex items-center text-gray-600 hover:text-orange-500 transition-colors"
              >
                <FaEnvelope className="mr-2" />
                contact@webreich.com
              </a>
              <a
                href="https://instagram.com/webreich"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-orange-500 transition-colors"
              >
                <FaInstagram className="mr-2" />
                @webreich
              </a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-orange-200 pt-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} WebReich Community. All rights reserved.
              </p>
              <div className="flex items-center text-gray-600 text-sm">
                Made with <FaHeart className="text-orange-500 mx-1" /> by WebReich Development Team
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;