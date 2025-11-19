import React from "react";
import { Link } from "react-router-dom";

interface MemberData {
  image: string;
  firstName: string;
  isLeader: boolean;
}

interface CommissieCardProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  members?: MemberData[];
  isBestuur?: boolean;
}

const CommissieCard: React.FC<CommissieCardProps> = ({
  title,
  description,
  buttonText = "Meer Lezen",
  buttonLink = "#",
  image,
  members = [],
  isBestuur = false,
}) => {
  const imageHeightClass = isBestuur ? "h-64" : "h-48";
  const membersPerSlide = isBestuur ? 4 : 5;
  const shouldScroll = members.length >= membersPerSlide;
  const duplicatedMembers = React.useMemo(() => {
    return shouldScroll ? [...members, ...members] : members;
  }, [members, shouldScroll]);
  const scrollDuration = React.useMemo(() => {
    if (!shouldScroll) return 0;
    return Math.max(members.length * 4, 24);
  }, [members.length, shouldScroll]);

  const renderMember = (member: MemberData, index: number) => (
    <div key={`${member.image}-${index}`} className="flex flex-col items-center gap-1">
      <div className="relative">
        <div
          className={`rounded-full overflow-hidden border-2 ${
            member.isLeader
              ? "border-geel ring-4 ring-geel/30"
              : "border-beige/40"
          } ${isBestuur ? "w-16 h-16" : "w-14 h-14"}`}
        >
          <img src={member.image} alt={member.firstName || "Commissielid"} className="w-full h-full object-cover" />
        </div>
        {member.isLeader && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-paars text-geel text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Voorzitter
          </span>
        )}
      </div>
      {isBestuur && member.firstName && (
        <span className="text-xs text-geel font-semibold text-center max-w-[5rem] leading-tight">
          {member.firstName}
        </span>
      )}
    </div>
  );

  const renderCarousel = (alignStart = false) => (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className={`flex gap-4 items-center ${
            shouldScroll ? "w-max" : `${alignStart ? "justify-start" : "justify-center"} flex-wrap`
          }`}
          style={
            shouldScroll
              ? { animation: `committeeAvatarScroll ${scrollDuration}s linear infinite` }
              : undefined
          }
        >
          {duplicatedMembers.map((member, index) => renderMember(member, index))}
        </div>
      </div>
    </div>
  );

  return (
    <Link to={buttonLink} className="block h-full group">
      <div
        className={`bg-paars text-beige rounded-3xl p-6 lg:p-7 h-full shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col gap-5 ${
          isBestuur ? "lg:gap-6" : ""
        }`}
      >
        <div className={`flex flex-col gap-5 ${isBestuur ? "lg:flex-row lg:gap-8" : ""}`}>
          <div className={`${isBestuur ? "lg:w-1/2" : ""} flex flex-col gap-4`}>
            {image && (
              <div className="w-full">
                <img
                  src={image}
                  alt={title}
                  className={`w-full ${imageHeightClass} object-cover rounded-2xl`}
                />
              </div>
            )}

            <h3
              className="text-geel font-bold text-center lg:text-left break-words leading-tight"
              style={{
                fontSize:
                  title.length > 30 ? "1.125rem" : title.length > 20 ? "1.375rem" : "1.5rem",
              }}
            >
              {title}
            </h3>

            <p className="text-base text-center lg:text-left leading-relaxed">
              {description}
            </p>
          </div>

          {members.length > 0 && (
            <div className={`${isBestuur ? "lg:w-1/2" : ""} w-full`}>
              <p className="text-sm uppercase tracking-[0.3em] text-geel/80 text-center lg:text-left mb-2">
                {isBestuur ? "Bestuur" : "Leden"}
              </p>
              {isBestuur ? (
                <>
                  <div className="lg:hidden">
                    {renderCarousel(true)}
                  </div>
                  <div className="hidden lg:flex flex-col gap-4">
                    {members.map((member, index) => (
                      <div key={`${member.image}-${index}`} className="flex items-center gap-4 bg-paars/60 rounded-2xl p-3">
                        <div className="relative">
                          <div
                            className={`rounded-full overflow-hidden border-2 ${
                              member.isLeader
                                ? "border-geel ring-4 ring-geel/30"
                                : "border-beige/40"
                            } w-16 h-16`}
                          >
                            <img src={member.image} alt={member.firstName || "Bestuurslid"} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-geel">{member.firstName}</span>
                          {member.isLeader && (
                            <span className="text-xs uppercase tracking-widest text-geel/80">Voorzitter</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                renderCarousel()
              )}
            </div>
          )}
        </div>

        <div className="text-samu bg-geel group-hover:bg-yellow-400 text-lg rounded-full font-bold py-3 px-8 transition-colors text-center">
          {buttonText}
        </div>
      </div>
    </Link>
  );
};

export default CommissieCard;
