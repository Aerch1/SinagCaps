"use client";

import { useState } from "react";
import Input from "../../components/ui/Input.jsx";
import HeroBanner from "../../components/section/HeroBanner.jsx";
import { User, Mail, Phone, Tag, MapPin, ArrowRight, Loader2 } from "lucide-react";
import api from "@/api/api";
import toast from "react-hot-toast";

const HERO_IMG = "/forgot.jpg";
const PLACE_NAME =
  "Our Lady of Peace and Good Voyage Parish - Lodlod, Lipa City, Batangas ";
const PLACE_LINK =
  "https://www.google.com/maps/place/Our+Lady+of+Peace+and+Good+Voyage+Parish+-+Lodlod,+Lipa+City,+Batangas+(Archdiocese+of+Lipa)/@13.9310824,121.1423383,17z";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(
  PLACE_NAME
)}&output=embed`;

export default function Contact() {
  const [isSending, setIsSending] = useState(false);

  /* --------------------------------------------
     🧩 Simple Client-Side Validation Function
  ---------------------------------------------*/
  const validateForm = (data) => {
    if (!data.firstName?.trim()) return "First name is required.";
    if (!data.lastName?.trim()) return "Last name is required.";
    if (!data.email?.trim()) return "Email address is required.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email))
      return "Please enter a valid email address.";
    if (!data.subject?.trim()) return "Subject is required.";
    if (!data.message?.trim()) return "Message is required.";
    return null;
  };

  /* --------------------------------------------
     📤 Form Submission
  ---------------------------------------------*/
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const errorMsg = validateForm(data);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    let toastId;
    try {
      setIsSending(true);
      toastId = toast.loading("Sending your message...");

      const res = await api.post("/public/contact", data);
      if (res.data.success) {
        toast.success("Message sent successfully!", { id: toastId });
        e.target.reset();
      } else {
        toast.error(res.data.error || "Something went wrong.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message. Please try again later.", { id: toastId });
    } finally {
      setIsSending(false);
      toast.dismiss(toastId);
    }
  };

  /* --------------------------------------------
     🧱 UI Layout
  ---------------------------------------------*/
  return (
    <main className="bg-white">
      <HeroBanner title="Contact Us" imageSrc={HERO_IMG} />

      {/* Header Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        <div className="text-center">
          <p className="text-amber-500 italic">Contact Us</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
            Get In Touch With Our Parish
          </h2>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Please fill out the form below and we’ll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Form + Info Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Contact Form */}
          <div className="self-start bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 sm:p-8">
            <header className="mb-6">
              <h3 className="text-lg text-gray-900">Contact With Us</h3>
              <p className="mt-1 text-sm text-gray-500">
                Send us a message and we’ll respond as soon as possible.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input icon={User} id="firstName" name="firstName" type="text" placeholder="First Name*" required />
                <Input icon={User} id="lastName" name="lastName" type="text" placeholder="Last Name*" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input icon={Mail} id="email" name="email" type="email" placeholder="Email Address*" required />
                <Input icon={Phone} id="phone" name="phone" type="tel" placeholder="Phone Number" />
              </div>

              <Input icon={Tag} id="subject" name="subject" type="text" placeholder="Subject*" required />

              <div>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Your Message here*"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-black/40 ${
                  isSending ? "bg-gray-400 cursor-not-allowed" : "bg-secondary/90 hover:bg-secondary"
                }`}
              >
                {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSending ? "Sending..." : "Submit"}
              </button>
            </form>
          </div>

          {/* RIGHT: Parish Info + Map */}
          <div className="h-full flex flex-col gap-6 py-6">
            {/* Call Us */}
            <section className="flex items-start gap-4">
              <span className="inline-grid h-6 w-6 shrink-0 place-items-center mt-1">
                <Phone className="h-5 w-5 text-blue-600" />
              </span>
              <div className="space-y-2">
                <h3 className="text-base text-gray-900">Call Us</h3>
                <p className="text-sm text-gray-600">Reach us during working hours for quick assistance.</p>
                <a href="tel:+639358841922" className="block text-sm text-blue-600 hover:underline">
                  (+63) 935 884 1922
                </a>
              </div>
            </section>

            {/* Visit Us */}
            <section className="flex items-start gap-4">
              <span className="inline-grid h-6 w-6 shrink-0 place-items-center mt-1">
                <MapPin className="h-5 w-5 text-blue-600" />
              </span>
              <div className="space-y-2">
                <h3 className="text-base text-gray-900">Visit Us</h3>
                <p className="text-sm text-gray-600">
                  You can visit the parish office at the address below.
                </p>
                <a href={PLACE_LINK} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline">
                  {PLACE_NAME}
                </a>
              </div>
            </section>

            {/* Live Chat Info */}
            <section className="flex items-start gap-4">
              <span className="inline-grid h-6 w-6 shrink-0 place-items-center mt-1">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </span>
              <div className="space-y-2">
                <h3 className="text-base text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-600">
                  You can contact us through the chat widget when an admin is online or during working hours. If no one is available, please send your message using the form.
                </p>
                <p className="text-xs text-gray-500">Working hours: Mon – Sat, 9:00 – 5:00</p>
              </div>
            </section>

            {/* Google Map */}
            <div className="flex-1 rounded-xl overflow-hidden min-h-[280px] md:min-h-[360px]">
              <iframe
                title="Parish location"
                src={MAP_EMBED_SRC}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
