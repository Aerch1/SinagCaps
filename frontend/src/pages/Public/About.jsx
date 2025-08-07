export default function About() {
    return (
        <div className="bg-white px-6 py-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                <p className="text-base font-semibold leading-7 text-blue-600">About Us</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Learn more about our platform
                </h1>
                <p className="mt-6 text-xl leading-8">
                    This is a full-stack application built with React, Node.js, and MySQL. It features role-based authentication
                    and a modern admin interface.
                </p>
                <div className="mt-10 max-w-2xl">
                    <p>
                        Our platform provides a secure and scalable solution for web applications that require user authentication
                        and administrative capabilities. Built with modern technologies and best practices.
                    </p>
                    <ul role="list" className="mt-8 max-w-xl space-y-8 text-gray-600">
                        <li className="flex gap-x-3">
                            <span>
                                <strong className="font-semibold text-gray-900">Secure by design.</strong>
                                JWT tokens, bcrypt password hashing, and secure cookie handling.
                            </span>
                        </li>
                        <li className="flex gap-x-3">
                            <span>
                                <strong className="font-semibold text-gray-900">Role-based access.</strong>
                                Different interfaces for regular users and administrators.
                            </span>
                        </li>
                        <li className="flex gap-x-3">
                            <span>
                                <strong className="font-semibold text-gray-900">Modern UI.</strong>
                                Built with Tailwind CSS and modern React patterns.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
