import karthiyaNew from '../assets/karthiya_banu_new.png'; // Updated Image
import umaraniNew from '../assets/umarani_new.jpg'; // Updated Image
import profile2 from '../assets/profile02.PNG';

export default function Team() {
    const team = [
        {
            name: "Dr. Karthiya Banu",
            role: "Founder",
            image: karthiyaNew, // Use new image
            desc: "A computer science professional with 17 years of teaching experience and 14 years' experience in the field of soft skills and technical training."
        },
        {
            name: "Dr.R.Ravanan M.Sc., M.Phil., Ph.D., FSMS",
            role: "Mentor",
            image: profile2,
            desc: `"Tamil Nadu Scientist Awardee"\nJoint Director (P & D) (Retd)\nDirectorate of Collegiate Education\nChennai - 600 015`
        },
        {
            name: "Dr. UMARANI S",
            role: "Technical Consultant",
            image: umaraniNew, // Updated Image
            desc: "Encouraged students to participate and explore their talents in various inter and intra technical events (Over all Performance award received from Loyola Institute of Technology ,Chennai - 2010).Guided students in carrying out Industry Projects(Like Mobishare, Tamil Calendar, Cricket Score Board, Website Creation) , IEEE Based Research Projects and Applications Projects."
        }
    ];

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h3 className="text-sm font-bold text-orange-500 tracking-wider uppercase mb-2">TEAM</h3>
                    <h2 className="text-4xl font-bold text-gray-900">CHECK OUR TEAM</h2>
                </div>

                {/* Updated grid to 3 columns for better alignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {team.map((member, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-center">
                            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                            <p className="text-blue-500 font-medium mb-4">{member.role}</p>
                            {/* Added whitespace-pre-line to respect newlines in description */}
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                {member.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
