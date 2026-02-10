import React from 'react'

const Header = () => {
  return (
    <div className="bg-slate-800 text-white text-center py-5 px-2.5">
      <div className="flex items-center justify-between max-w-6xl mx-auto flex-wrap gap-4">
        <div className="flex-shrink-0">
          <div className="bg-white w-[140px] h-[140px] rounded-full flex items-center justify-center overflow-hidden p-2" style={{ border: '3px solid rgb(60 133 125)' }}>
            <img 
              src="/tz-logo.jpg" 
              alt="Tanzania Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="flex-1 text-center px-4 min-w-[300px]">
          <div className="text-sm text-slate-300">
            The United Republic Of Tanzania
          </div>
          <div className="text-sm text-slate-300">
            Ministry of Education, Science and Technology
          </div>
          <h1 className="text-2xl md:text-3xl font-bold my-1.5 text-white">
            MBEYA UNIVERSITY OF SCIENCE AND TECHNOLOGY
          </h1>
          <p className="text-base text-slate-100">
            Leading Centre of Excellence for Knowledge, Skills, and Applied Education in Science and Technology
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-white w-[140px] h-[140px] rounded-full flex items-center justify-center overflow-hidden " style={{ border: '3px solid rgb(60 133 125)' }}>
            <img 
              src="/must-logo.png" 
              alt="MUST Logo" 
              className="w-full h-full object-contain relative"
              style={{ top: '-16px', position: 'relative' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header